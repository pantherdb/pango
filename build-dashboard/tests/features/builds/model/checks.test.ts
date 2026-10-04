// @vitest-environment node
import { buildFindings, comparisonFindings, runFindings } from '@/features/builds/model/checks'
import { parseRun } from '@/features/builds/model/parse'
import { previousBuild } from '@/features/builds/model/summary'
import { FIXTURE_NOW } from '@tests/mocks/api'
import { FIXTURES } from '@tests/mocks/upstream'
import { createBuildsStore } from '../../../../server/buildsStore'

const store = createBuildsStore({ buildsDir: FIXTURES, now: () => FIXTURE_NOW })
const { builds } = store.builds()
const byLabel = (label: string) => builds.find(build => build.label?.startsWith(label))!

const findingsOf = (label: string) => {
  const summary = byLabel(label)
  const response = store.build(summary.buildId)
  if (!response.ok) throw new Error(response.message)
  return buildFindings(response.body.summary, response.body.runs, FIXTURE_NOW)
}

const titles = (findings: { severity: string; title: string }[]) =>
  findings.map(f => `${f.severity}: ${f.title}`)

describe('buildFindings', () => {
  it('says what failed in a failed build, worst first', () => {
    expect(titles(findingsOf('Failed build'))).toEqual([
      'fail: index_es failed for pango-2',
      'fail: 3 documents failed to load into the pango-2 indexes',
      'warn: 1 planned step never ran',
      'warn: 1 PMID cited in pango-1 has no article',
      'info: taxon_id is a string in the annotation index and a number in the gene index',
      'info: Ran on uncommitted loader code',
    ])
    const failed = findingsOf('Failed build')[0]
    expect(failed.detail).toBe(
      '3 documents failed to load, so the indexes are incomplete; see logfile.log'
    )
    expect(failed.runId).toContain('index_es-pango-2')
  })

  it('reports lost NCBI batches and the PMIDs left without articles', () => {
    expect(titles(findingsOf('NCBI trouble'))).toEqual(
      expect.arrayContaining([
        'warn: 2 NCBI batches failed for pango-1',
        'warn: 200 PMIDs cited in pango-1 have no article',
      ])
    )
    expect(findingsOf('NCBI trouble').find(f => f.title.startsWith('2 NCBI'))!.detail).toBe(
      '200 PMIDs got no article in this build; the next build asks for them again.'
    )
  })

  it('names the run that stopped reporting', () => {
    expect(titles(findingsOf('Killed build'))[0]).toBe(
      'fail: index_es · pango-2 stopped reporting 4 h ago'
    )
  })

  it('finds nothing to fail in a clean build', () => {
    expect(findingsOf('pango-test').filter(f => f.severity !== 'info')).toEqual([])
  })
})

describe('comparisonFindings', () => {
  it('flags a large drop since the previous build of a dataset', () => {
    const ncbi = byLabel('NCBI trouble')
    const [finding] = comparisonFindings(ncbi, dataset => previousBuild(builds, ncbi, dataset))
    expect(finding).toMatchObject({
      severity: 'warn',
      title: 'pango-1 changed a lot since Failed build (synthetic)',
    })
    expect(finding.detail).toBe('annotations −13,644 (−15.0 %)')
  })

  it('is quiet when nothing moved', () => {
    const full = byLabel('pango-1 + pango-2')
    expect(comparisonFindings(full, dataset => previousBuild(builds, full, dataset))).toEqual([])
  })
})

describe('runFindings', () => {
  it('words a stale run for the person who has to act', () => {
    const run = parseRun({
      schema_version: 1,
      status: 'running',
      updated_at: '2026-10-04T13:50:00.000Z',
      heartbeat_s: 10,
    })
    const [finding] = runFindings(run, 'stale', FIXTURE_NOW)
    expect(finding.title).toBe('No update since 10 min ago')
    expect(finding.detail).toMatch(/writes every 10 s and has been silent for 600 s/)
  })

  it('notes records the recorder had to cut short', () => {
    const run = parseRun({
      schema_version: 1,
      status: 'ok',
      dropped: { log_events: 12, artifacts: 0 },
    })
    expect(titles(runFindings(run, 'ok', FIXTURE_NOW))).toEqual([
      'info: Some details were left out of the record',
    ])
  })
})
