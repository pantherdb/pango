// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { FIXTURE_NOW } from '@tests/mocks/api'
import { FIXTURES } from '@tests/mocks/upstream'
import { createBuildsStore, isSafeId } from '../../server/buildsStore'

const FAILED = '20261004T110000Z-all-f41d'

describe('the builds store over the fixtures', () => {
  const store = createBuildsStore({ buildsDir: FIXTURES, now: () => FIXTURE_NOW })

  it('lists every readable build with the server clock', () => {
    const list = store.builds()
    expect(list.builds).toHaveLength(8)
    expect(list.unreadable).toEqual([])
    expect(list.serverTime).toBe(FIXTURE_NOW.toISOString())
  })

  it('serves a build as written, with its summary and runs in start order', () => {
    const result = store.build(FAILED)
    if (!result.ok) throw new Error(result.message)
    expect((result.body.build as { build_id: string }).build_id).toBe(FAILED)
    expect(result.body.summary.health).toBe('failed')
    const starts = result.body.runs.map(run => run.startedAt)
    expect(starts).toEqual([...starts].sort())
    expect(result.body.runs).toHaveLength(11)
  })

  it('serves a run as written, and pages through its events', () => {
    const runId = fs.readdirSync(path.join(FIXTURES, FAILED, 'runs'))[0]
    const run = store.run(FAILED, runId)
    expect(run.ok && (run.body.run as { run_id: string }).run_id).toBe(runId)
    const first = store.events(FAILED, runId, 0, 3)
    if (!first.ok) throw new Error(first.message)
    expect(first.body.events.map(e => e.seq)).toEqual([1, 2, 3])
    const rest = store.events(FAILED, runId, first.body.next, 100)
    expect(rest.ok && rest.body.events[0].seq).toBe(4)
  })

  it('refuses ids that could be paths', () => {
    expect(isSafeId('20261004T110000Z-all-f41d')).toBe(true)
    for (const bad of ['..', '../loader', 'a/b', '.hidden', '']) expect(isSafeId(bad)).toBe(false)
    expect(store.build('..')).toMatchObject({ ok: false, status: 404 })
    expect(store.run(FAILED, '../../x')).toMatchObject({ ok: false, status: 404 })
    expect(store.build('no-such-build')).toMatchObject({ ok: false, status: 404 })
  })
})

describe('the builds store as builds are written', () => {
  let dir: string
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'builds-'))
    fs.cpSync(path.join(FIXTURES, FAILED), path.join(dir, FAILED), { recursive: true })
  })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('names a record it cannot read instead of failing the list', () => {
    const runId = fs.readdirSync(path.join(dir, FAILED, 'runs'))[0]
    fs.writeFileSync(path.join(dir, FAILED, 'runs', runId, 'run.json'), '{ half a reco')
    const list = createBuildsStore({ buildsDir: dir, now: () => FIXTURE_NOW }).builds()
    expect(list.builds).toHaveLength(1)
    expect(list.unreadable).toEqual([expect.stringContaining(`${FAILED}/runs/${runId}/run.json`)])
  })

  it('rereads a record when it changes, and skips a build folder with no build.json yet', () => {
    const store = createBuildsStore({ buildsDir: dir, now: () => FIXTURE_NOW })
    expect(store.builds().builds[0].label).toBe('Failed build (synthetic)')
    const file = path.join(dir, FAILED, 'build.json')
    const build = JSON.parse(fs.readFileSync(file, 'utf-8'))
    fs.writeFileSync(file, JSON.stringify({ ...build, label: 'Renamed' }))
    expect(store.builds().builds[0].label).toBe('Renamed')

    fs.mkdirSync(path.join(dir, '20261004T150000Z-all-0000', 'runs'), { recursive: true })
    expect(store.builds().builds).toHaveLength(1)
  })

  it('answers with an empty list when the builds dir does not exist', () => {
    const list = createBuildsStore({ buildsDir: path.join(dir, 'missing') }).builds()
    expect(list.builds).toEqual([])
  })
})
