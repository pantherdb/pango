/**
 * Builds and runs, cut down for lists: what the builds table, the pipeline grid and the
 * comparisons need, without the full records. The server makes them (cached per record), the
 * pages read them.
 *
 * Relative imports only (see parse.ts).
 */

import { buildFindings, countFindings } from './checks'
import { buildHealth, runHealth } from './health'
import type {
  BuildRecord,
  BuildSummary,
  DatasetPlan,
  DatasetSummary,
  Health,
  RunRecord,
  RunSummary,
  StepCell,
} from './types'

export type RunFacts = Omit<RunSummary, 'health'>

/** What a run's summary says that doesn't depend on the clock (the server caches these). */
export function runFacts(run: RunRecord): RunFacts {
  const failedPhases = run.phases.filter(phase => phase.status === 'failed').length
  const current = [...run.phases].reverse().find(phase => phase.status === 'running')
  return {
    runId: run.runId,
    buildId: run.buildId,
    step: run.step,
    dataset: run.dataset,
    title: run.title,
    status: run.status,
    statusReason: run.statusReason,
    exitCode: run.exitCode,
    startedAt: run.startedAt,
    updatedAt: run.updatedAt,
    finishedAt: run.finishedAt,
    durationS: run.durationS,
    heartbeatS: run.heartbeatS,
    phases: { total: run.phases.length, failed: failedPhases, current: current?.name ?? null },
    progress: run.progress,
    warnings: run.logs.warning.total,
    errors: run.logs.error.total,
    httpFailed: run.http?.failed ?? 0,
    counters: run.counters,
  }
}

export function summarizeRun(run: RunRecord, now: Date): RunSummary {
  const facts = runFacts(run)
  return { ...facts, health: healthOfSummary(facts, now) }
}

export function healthOfSummary(run: RunFacts, now: Date): Health {
  return runHealth(
    {
      status: run.status,
      updatedAt: run.updatedAt,
      heartbeatS: run.heartbeatS,
      errors: run.errors,
      failedPhases: run.phases.failed,
      httpFailed: run.httpFailed,
      counters: run.counters,
    },
    now
  )
}

const startOf = (run: { startedAt: string | null }) =>
  run.startedAt ? Date.parse(run.startedAt) : 0

export const byRunStart = (a: RunSummary, b: RunSummary) =>
  startOf(a) - startOf(b) || a.runId.localeCompare(b.runId)

/** The latest run of a step for a dataset (a step can be run again within a build). */
export const latestRun = (runs: RunSummary[], dataset: string | null, step: string) =>
  runs
    .filter(run => run.dataset === dataset && run.step === step)
    .sort(byRunStart)
    .at(-1) ?? null

/** Which counters of which step describe a dataset; their names don't collide. */
const DATASET_COUNTERS: Record<string, readonly string[] | 'all'> = {
  get_articles: ['batches_failed', 'pmids_failed', 'pmids_unknown', 'articles_fetched'],
  index_es: ['docs_indexed', 'bulk_errors'],
  report: 'all',
  verify: 'all',
}

export function datasetCounters(
  runs: RunSummary[],
  dataset: string | null
): Record<string, number> {
  const counters: Record<string, number> = {}
  for (const [step, names] of Object.entries(DATASET_COUNTERS)) {
    const run = latestRun(runs, dataset, step)
    if (!run) continue
    for (const [name, value] of Object.entries(run.counters)) {
      if (names === 'all' || names.includes(name)) counters[name] = value
    }
  }
  return counters
}

/** One dataset's row of the pipeline grid: its planned steps, then any it ran unplanned. */
export function stepCells(
  plan: string[],
  runs: RunSummary[],
  dataset: string | null,
  buildGoingOn: boolean
): StepCell[] {
  const ran = runs.filter(run => run.dataset === dataset).map(run => run.step)
  const steps = [
    ...plan,
    ...ran.filter((step, i) => !plan.includes(step) && ran.indexOf(step) === i),
  ]
  return steps.map(step => {
    const matching = runs.filter(run => run.dataset === dataset && run.step === step)
    const latest = latestRun(runs, dataset, step)
    return {
      step,
      state: latest ? latest.health : buildGoingOn ? 'pending' : 'not_reached',
      runId: latest?.runId ?? null,
      startedAt: latest?.startedAt ?? null,
      finishedAt: latest?.finishedAt ?? null,
      durationS: latest?.durationS ?? null,
      earlierRuns: Math.max(0, matching.length - 1),
    }
  })
}

/** The build's datasets: the ones it planned, then any its runs name that it didn't. */
export function datasetPlans(build: BuildRecord, runs: RunSummary[]): DatasetPlan[] {
  // A one-run build names its dataset when its run finishes; until then the run knows it first.
  const named = [...new Set(runs.map(run => run.dataset))]
  if (build.datasets.length === 1 && build.datasets[0].id === null && named.length === 1) {
    return [{ ...build.datasets[0], id: named[0] }]
  }
  const plans = [...build.datasets]
  for (const dataset of named) {
    if (!plans.some(plan => plan.id === dataset)) {
      plans.push({
        id: dataset,
        inputDir: null,
        outputDir: null,
        release: null,
        inputs: [],
        steps: [],
        indexes: null,
      })
    }
  }
  return plans
}

export function lastActivity(build: BuildRecord, runs: RunSummary[]): string | null {
  const times = [build.updatedAt, ...runs.map(run => run.updatedAt)]
    .filter((time): time is string => !!time)
    .sort()
  return times.at(-1) ?? null
}

export function summarizeBuild(build: BuildRecord, runs: RunSummary[], now: Date): BuildSummary {
  const sorted = [...runs].sort(byRunStart)
  const health = buildHealth(
    {
      status: build.status,
      lastActivity: lastActivity(build, sorted),
      runHealths: sorted.map(run => run.health),
    },
    now
  )
  const goingOn = health === 'running'
  const datasets: DatasetSummary[] = datasetPlans(build, sorted).map(plan => ({
    id: plan.id,
    steps: stepCells(plan.steps, sorted, plan.id, goingOn),
    counters: datasetCounters(sorted, plan.id),
    indexes: plan.indexes,
    release: plan.release,
  }))
  const base = {
    buildId: build.buildId,
    label: build.label,
    script: build.script,
    status: build.status,
    statusReason: build.statusReason,
    exitCode: build.exitCode,
    startedAt: build.startedAt,
    updatedAt: lastActivity(build, sorted),
    finishedAt: build.finishedAt,
    durationS: build.durationS,
    asOf: build.asOf,
    health,
    live: goingOn,
    git: build.git,
    esUrl: build.esUrl,
    datasets,
    runs: sorted.length,
    warnings: sorted.reduce((sum, run) => sum + run.warnings, 0),
    errors: sorted.reduce((sum, run) => sum + run.errors, 0),
    issues: build.issues,
  }
  return {
    ...base,
    findings: countFindings(
      buildFindings({ ...base, findings: { fail: 0, warn: 0, info: 0 } }, sorted, now)
    ),
  }
}

/** Newest first, by the date the data describes and then by start. */
export const byBuildDateDesc = (a: BuildSummary, b: BuildSummary) =>
  (b.asOf ?? '').localeCompare(a.asOf ?? '') || (b.startedAt ?? '').localeCompare(a.startedAt ?? '')

/** The previous build of a dataset: the latest one dated before `build` with a report for it. */
export function previousBuild(
  builds: BuildSummary[],
  build: BuildSummary,
  dataset: string | null
): BuildSummary | null {
  const date = build.asOf ?? build.startedAt ?? ''
  return (
    [...builds]
      .sort(byBuildDateDesc)
      .find(
        other =>
          other.buildId !== build.buildId &&
          (other.asOf ?? other.startedAt ?? '') < date &&
          other.datasets.some(d => d.id === dataset && 'annotations' in d.counters)
      ) ?? null
  )
}

export const datasetOf = (build: BuildSummary, dataset: string | null) =>
  build.datasets.find(d => d.id === dataset) ?? null
