// @vitest-environment node
import {
  builtBy,
  buildsMatchingCounts,
  compareLive,
  createdByBuild,
} from '@/features/builds/model/live'
import type { ApiProbe, EsProbe } from '@/features/builds/model/types'
import { FIXTURE_NOW } from '@tests/mocks/api'
import { FIXTURES } from '@tests/mocks/upstream'
import { createBuildsStore } from '../../../../server/buildsStore'

const { builds } = createBuildsStore({ buildsDir: FIXTURES, now: () => FIXTURE_NOW }).builds()
const full = builds.find(build => build.label?.startsWith('pango-1 + pango-2'))!
const pango1 = full.datasets.find(d => d.id === 'pango-1')!
const indexStart = Date.parse(pango1.steps.find(cell => cell.step === 'index_es')!.startedAt!)
const at = (ms: number) => new Date(ms).toISOString()

const es = (overrides: Partial<EsProbe> = {}): EsProbe => ({
  target: 'build',
  url: 'http://es.test',
  reachable: true,
  error: null,
  version: '8.5.0',
  cluster: 'c',
  indexes: full.datasets.flatMap(d => [
    {
      name: d.indexes!.annotations!,
      exists: true,
      docs: d.counters.annotations,
      health: 'green',
      createdAt: at(indexStart + 1000),
      error: null,
    },
    {
      name: d.indexes!.genes!,
      exists: true,
      docs: d.counters.genes,
      health: 'green',
      createdAt: at(indexStart + 1000),
      error: null,
    },
  ]),
  ...overrides,
})

const api = (versions: ApiProbe['versions']): ApiProbe => ({
  target: 'production',
  url: 'http://api.test',
  reachable: true,
  blocked: false,
  error: null,
  versions,
})

const counts = (version: string, annotations: number, genes: number) => ({
  version,
  annotations,
  genes,
  error: null,
  blocked: false,
})

describe('createdByBuild', () => {
  it("is true within the dataset's index_es run, give or take 5 s", () => {
    expect(createdByBuild(pango1, at(indexStart - 4000))).toBe(true)
    expect(createdByBuild(pango1, at(indexStart - 6000))).toBe(false)
    expect(createdByBuild(pango1, null)).toBeNull()
  })

  it('finds the build that made an index', () => {
    expect(builtBy(builds, 'pango-1', at(indexStart + 1000))?.buildId).toBe(full.buildId)
    expect(builtBy(builds, 'pango-1', '2025-01-30T00:00:00.000Z')).toBeNull()
  })
})

describe('compareLive', () => {
  it('matches a cluster still holding what the build loaded', () => {
    const rows = compareLive(full, es(), [])
    expect(
      rows
        .filter(row => row.dataset === 'pango-1')
        .map(row => [row.what, row.expected, row.live, row.state, row.note])
    ).toEqual([
      ['annotations', 90961, 90961, 'match', "This build's index"],
      ['genes', 20851, 20851, 'match', "This build's index"],
    ])
  })

  it("says an index with the right counts but another build's creation time differs", () => {
    const later = es()
    later.indexes = later.indexes.map(ix => ({ ...ix, createdAt: '2026-10-05T00:00:00.000Z' }))
    const [row] = compareLive(full, later, [])
    expect([row.state, row.note]).toEqual([
      'differs',
      "Not this build's index: created 2026-10-05T00:00:00.000Z",
    ])
  })

  it('tells a missing index, an unreachable cluster and an unasked version apart', () => {
    const missing = es()
    missing.indexes = missing.indexes.slice(1)
    expect(compareLive(full, missing, [])[0].state).toBe('missing')
    expect(compareLive(full, es({ reachable: false, error: 'fetch failed' }), [])[0]).toMatchObject(
      { state: 'unreachable', note: 'fetch failed' }
    )
    expect(compareLive(full, null, [api([])])[0]).toMatchObject({ state: 'not_served' })
  })

  it("compares an API's counts per version", () => {
    const rows = compareLive(full, null, [
      api([counts('pango-1', 90961, 20851), counts('pango-2', 80000, 20580)]),
    ])
    expect(rows.map(row => `${row.dataset} ${row.what} ${row.state}`)).toEqual([
      'pango-1 annotations match',
      'pango-1 genes match',
      'pango-2 annotations differs',
      'pango-2 genes match',
    ])
  })

  it('tells a bot challenge from an API that is down', () => {
    const blocked = {
      version: 'pango-1',
      annotations: null,
      genes: null,
      error: 'Blocked',
      blocked: true,
    }
    const [row] = compareLive(full, null, [api([blocked])])
    expect([row.state, row.note]).toEqual(['blocked', 'Blocked'])
  })

  it('finds builds whose counts an API serves', () => {
    expect(buildsMatchingCounts(builds, 'pango-2', 86886, 20580).map(build => build.label)).toEqual(
      expect.arrayContaining([
        'pango-1 + pango-2 full-data capture',
        'pango-2 as built in January 2026 (backfill)',
      ])
    )
    expect(buildsMatchingCounts(builds, 'pango-2', 1, 2)).toEqual([])
  })
})
