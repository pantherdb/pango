/**
 * What the dashboard says about a run or a build, beyond the status it wrote about itself.
 *
 * A process can't record its own death: a killed run leaves `status: running` behind. The
 * recorder refreshes `updated_at` every `heartbeat_s`, so a running record that hasn't moved for
 * several heartbeats is stale. A run that ended `ok` but logged errors, failed a phase, had HTTP
 * calls fail, or (report, verify) found problems in the data is `issues`: done, but look.
 */

import type { Health } from './types'

/** Worst first, after `running`: a failure is certain, a stale run may yet finish. */
export const HEALTHS: readonly Health[] = [
  'running',
  'failed',
  'stale',
  'interrupted',
  'unknown',
  'issues',
  'ok',
]

/** Missed heartbeats before a running record is called stale. */
export const STALE_AFTER_HEARTBEATS = 6
export const MIN_STALE_AFTER_S = 60

export function staleAfterS(heartbeatS: number): number {
  const beat = heartbeatS > 0 ? heartbeatS : 10
  return Math.max(MIN_STALE_AFTER_S, STALE_AFTER_HEARTBEATS * beat)
}

/** Seconds from an ISO instant to `now`; null when it doesn't parse. */
export function secondsSince(iso: string | null, now: Date): number | null {
  if (!iso) return null
  const then = Date.parse(iso)
  return Number.isNaN(then) ? null : (now.getTime() - then) / 1000
}

/** Counters that, when above zero in an `ok` run, mean the data or the index has problems. */
export const PROBLEM_COUNTERS = [
  'checks_failed',
  'consistency_failed',
  'bulk_errors',
  'batches_failed',
]

export interface RunHealthInputs {
  status: string
  updatedAt: string | null
  heartbeatS: number
  errors: number
  failedPhases: number
  httpFailed: number
  counters: Record<string, number>
}

export function runHealth(run: RunHealthInputs, now: Date): Health {
  switch (run.status) {
    case 'running': {
      const silent = secondsSince(run.updatedAt, now)
      return silent === null || silent > staleAfterS(run.heartbeatS) ? 'stale' : 'running'
    }
    case 'ok':
      return run.errors > 0 ||
        run.failedPhases > 0 ||
        run.httpFailed > 0 ||
        PROBLEM_COUNTERS.some(name => (run.counters[name] ?? 0) > 0)
        ? 'issues'
        : 'ok'
    case 'failed':
    case 'interrupted':
      return run.status
    default:
      return 'unknown'
  }
}

/** The worst of several healths, `running` first. */
export function worstHealth(healths: Health[]): Health | null {
  for (const health of HEALTHS) {
    if (healths.includes(health)) return health
  }
  return null
}

export interface BuildHealthInputs {
  status: string
  /** The latest moment anything in the build wrote: build.json or any run. */
  lastActivity: string | null
  runHealths: Health[]
}

/**
 * A build is as live as its liveliest run and as bad as its worst. A build still `running` with
 * no running run is between steps, or its script died: stale once nothing has written for as long
 * as a run would take to go stale.
 */
export function buildHealth(build: BuildHealthInputs, now: Date): Health {
  const worst = worstHealth(build.runHealths)
  switch (build.status) {
    case 'running': {
      if (build.runHealths.includes('running')) return 'running'
      if (build.runHealths.includes('stale')) return 'stale'
      const silent = secondsSince(build.lastActivity, now)
      return silent === null || silent > MIN_STALE_AFTER_S ? 'stale' : 'running'
    }
    case 'ok':
      return worst && worst !== 'ok' ? (worst === 'running' ? 'issues' : worst) : 'ok'
    case 'failed':
    case 'interrupted':
      return build.status
    default:
      return 'unknown'
  }
}

export const emptyHealthCounts = (): Record<Health, number> => ({
  running: 0,
  stale: 0,
  failed: 0,
  interrupted: 0,
  unknown: 0,
  issues: 0,
  ok: 0,
})
