import fs from 'node:fs'
import path from 'node:path'
import { parseBuild, parseEvent, parseRun, schemaCheck } from '@/features/builds/model/parse'
import { FIXTURES } from '@tests/mocks/upstream'

const read = (...parts: string[]) =>
  JSON.parse(fs.readFileSync(path.join(FIXTURES, ...parts), 'utf-8'))
const builds = fs.readdirSync(FIXTURES)

describe('the fixtures, as the loader wrote them', () => {
  // The contract test: whatever the loader writes, this dashboard reads in full.
  it.each(builds)('build %s parses with nothing left unread', buildId => {
    const build = parseBuild(read(buildId, 'build.json'))
    expect(build.issues).toEqual([])
    expect(build.schema).toEqual({ version: 1, message: null })
    expect(build.buildId).toBe(buildId)
    for (const runId of fs.readdirSync(path.join(FIXTURES, buildId, 'runs'))) {
      const run = parseRun(read(buildId, 'runs', runId, 'run.json'))
      expect(run.issues, runId).toEqual([])
      expect(run.runId).toBe(runId)
      expect(run.buildId).toBe(buildId)
    }
  })

  it('reads a report run in full', () => {
    const dir = fs
      .readdirSync(path.join(FIXTURES, '20261004T090254Z-all-3002', 'runs'))
      .find(d => d.includes('report-pango-1'))!
    const run = parseRun(read('20261004T090254Z-all-3002', 'runs', dir, 'run.json'))
    expect(run.counters.annotations).toBe(90961)
    expect(run.breakdowns.annotations_by_aspect).toEqual(
      expect.objectContaining({ 'biological process': expect.any(Number) })
    )
    expect(run.sections.map(s => s.id)).toEqual([
      'inputs',
      'annotations',
      'evidence',
      'genes',
      'consistency',
    ])
    const genes = run.sections.find(s => s.id === 'genes')!
    expect(genes.headline[0]).toEqual(['Genes', 20851])
    expect(genes.tables.find(t => t.id === 'top_slim_terms')!.columns.at(-1)).toEqual({
      key: 'genes',
      label: 'Genes',
      kind: 'number',
    })
  })
})

describe('parseBuild and parseRun never throw', () => {
  it.each([null, 42, 'text', [], { build_id: 7, datasets: 'no', git: [], process: { argv: 'x' } }])(
    'reads %j as far as it can',
    raw => {
      const build = parseBuild(raw)
      expect(build.status).toBe('unknown')
      expect(build.datasets).toEqual([])
      expect(build.issues.length).toBeGreaterThan(0)
      const run = parseRun(raw)
      expect(run.status).toBe('unknown')
      expect(run.phases).toEqual([])
      expect(run.logs.warning).toEqual({ total: 0, keys: 0, overflow: 0, entries: [] })
    }
  )

  it('keeps an unknown status as written and drops counters that are not numbers', () => {
    const run = parseRun({
      schema_version: 1,
      status: 'paused',
      counters: { a: 1, b: 'two', c: null },
    })
    expect(run.status).toBe('paused')
    expect(run.counters).toEqual({ a: 1 })
    expect(run.issues).toEqual(['counters.b: expected a number', 'counters.c: expected a number'])
  })

  it('names the step and dataset in the title when the record has none', () => {
    expect(parseRun({ step: 'verify', dataset: 'pango-2' }).title).toBe('verify · pango-2')
    expect(parseRun({ step: 'verify' }).title).toBe('verify')
  })
})

describe('schemaCheck', () => {
  it('says when a record is newer, older or unversioned', () => {
    expect(schemaCheck(1).message).toBeNull()
    expect(schemaCheck(2).message).toMatch(/newer fields are not shown/)
    expect(schemaCheck(0).message).toMatch(/older/)
    expect(schemaCheck(null).message).toMatch(/no schema_version/)
  })
})

describe('parseEvent', () => {
  it('splits an event into its envelope and payload', () => {
    expect(parseEvent({ seq: 3, at: 't', type: 'http', items: 100 })).toEqual({
      seq: 3,
      at: 't',
      type: 'http',
      payload: { items: 100 },
    })
  })

  it('rejects what is not an event', () => {
    expect(parseEvent({ type: 'http' })).toBeNull()
    expect(parseEvent(null)).toBeNull()
  })
})
