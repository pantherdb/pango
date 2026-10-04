/**
 * What the live Elasticsearch and APIs hold, set against what a build recorded.
 *
 * Elasticsearch answers for itself: the index exists, its document count, and when it was
 * created, which says whether the live index is the one this build wrote. An API only answers
 * counts, so "matches build X" means the counts agree, not that X made the data.
 *
 * Relative imports only (see parse.ts).
 */

import type { ApiProbe, BuildSummary, DatasetSummary, EsProbe } from './types'

export type LiveState = 'match' | 'differs' | 'missing' | 'unreachable' | 'blocked' | 'not_served'

export interface LiveRow {
  dataset: string | null
  target: string
  kind: 'es' | 'api'
  /** `annotations` or `genes`. */
  what: string
  /** The index name, for Elasticsearch. */
  index: string | null
  expected: number | null
  live: number | null
  state: LiveState
  note: string | null
}

/** How far outside its index_es run an index's creation time may be and still be its own. */
export const CREATION_SLACK_MS = 5000

/** What a dataset should hold: the report's counts, else what verify expected. */
export function expectedCounts(dataset: DatasetSummary): {
  annotations: number | null
  genes: number | null
} {
  const c = dataset.counters
  return {
    annotations: c.annotations ?? c.annotations_expected ?? null,
    genes: c.genes ?? c.genes_expected ?? null,
  }
}

/** Whether an index created at `createdAt` was written by this dataset's index_es run. */
export function createdByBuild(dataset: DatasetSummary, createdAt: string | null): boolean | null {
  const cell = dataset.steps.find(step => step.step === 'index_es')
  if (!createdAt || !cell?.startedAt) return null
  const created = Date.parse(createdAt)
  const start = Date.parse(cell.startedAt) - CREATION_SLACK_MS
  const end = (cell.finishedAt ? Date.parse(cell.finishedAt) : Date.now()) + CREATION_SLACK_MS
  return created >= start && created <= end
}

/** The build whose index_es run created an index, if a recorded build did. */
export function builtBy(
  builds: BuildSummary[],
  dataset: string | null,
  createdAt: string | null
): BuildSummary | null {
  return (
    builds.find(build =>
      build.datasets.some(d => d.id === dataset && createdByBuild(d, createdAt) === true)
    ) ?? null
  )
}

/** Builds whose recorded counts for a dataset equal the live ones. */
export function buildsMatchingCounts(
  builds: BuildSummary[],
  dataset: string,
  annotations: number | null,
  genes: number | null
): BuildSummary[] {
  if (annotations === null || genes === null) return []
  return builds.filter(build =>
    build.datasets.some(d => {
      const expected = d.id === dataset ? expectedCounts(d) : null
      return expected?.annotations === annotations && expected.genes === genes
    })
  )
}

const compareCount = (expected: number | null, live: number | null): LiveState =>
  expected === null || live === null ? 'differs' : expected === live ? 'match' : 'differs'

function esRows(dataset: DatasetSummary, es: EsProbe): LiveRow[] {
  const expected = expectedCounts(dataset)
  return (['annotations', 'genes'] as const).map(what => {
    const index = dataset.indexes?.[what] ?? null
    const base = {
      dataset: dataset.id,
      target: es.target,
      kind: 'es' as const,
      what,
      index,
      expected: expected[what],
    }
    if (!es.reachable) return { ...base, live: null, state: 'unreachable', note: es.error }
    const live = es.indexes.find(ix => ix.name === index)
    if (!live || !live.exists)
      return { ...base, live: null, state: 'missing', note: 'No such index' }
    if (live.error) return { ...base, live: live.docs, state: 'unreachable', note: live.error }
    const own = createdByBuild(dataset, live.createdAt)
    const counts = compareCount(expected[what], live.docs)
    const note =
      own === false
        ? `Not this build's index: created ${live.createdAt}`
        : own === true
          ? "This build's index"
          : live.createdAt
            ? `Created ${live.createdAt}`
            : null
    return {
      ...base,
      live: live.docs,
      state: own === false && counts === 'match' ? 'differs' : counts,
      note,
    }
  })
}

function apiRows(dataset: DatasetSummary, api: ApiProbe): LiveRow[] {
  const expected = expectedCounts(dataset)
  return (['annotations', 'genes'] as const).map(what => {
    const base = {
      dataset: dataset.id,
      target: api.target,
      kind: 'api' as const,
      what,
      index: null,
      expected: expected[what],
    }
    const version = api.versions.find(v => v.version === dataset.id)
    if (!version) {
      return {
        ...base,
        live: null,
        state: 'not_served',
        note: `Not asked: ${dataset.id} is not in LIVE_API_VERSIONS`,
      }
    }
    if (version.error) {
      return {
        ...base,
        live: null,
        state: version.blocked ? 'blocked' : 'unreachable',
        note: version.error,
      }
    }
    const live = version[what]
    return { ...base, live, state: compareCount(expected[what], live), note: null }
  })
}

/** A build's datasets against the cluster it wrote to and the configured APIs. */
export function compareLive(build: BuildSummary, es: EsProbe | null, apis: ApiProbe[]): LiveRow[] {
  return build.datasets
    .filter(dataset => dataset.id !== null)
    .flatMap(dataset => [
      ...(es ? esRows(dataset, es) : []),
      ...apis.flatMap(api => apiRows(dataset, api)),
    ])
}
