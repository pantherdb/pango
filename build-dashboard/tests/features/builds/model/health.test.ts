import { buildHealth, runHealth, staleAfterS, worstHealth } from '@/features/builds/model/health'
import type { RunHealthInputs } from '@/features/builds/model/health'

const NOW = new Date('2026-10-04T14:00:00Z')
const ago = (seconds: number) => new Date(NOW.getTime() - seconds * 1000).toISOString()

const run = (overrides: Partial<RunHealthInputs>): RunHealthInputs => ({
  status: 'ok',
  updatedAt: ago(1),
  heartbeatS: 10,
  errors: 0,
  failedPhases: 0,
  httpFailed: 0,
  counters: {},
  ...overrides,
})

describe('runHealth', () => {
  it('calls a running record stale after six missed heartbeats, a minute at least', () => {
    expect(staleAfterS(10)).toBe(60)
    expect(staleAfterS(30)).toBe(180)
    expect(runHealth(run({ status: 'running', updatedAt: ago(59) }), NOW)).toBe('running')
    expect(runHealth(run({ status: 'running', updatedAt: ago(61) }), NOW)).toBe('stale')
    expect(runHealth(run({ status: 'running', updatedAt: null }), NOW)).toBe('stale')
  })

  it.each([
    ['errors', { errors: 2 }],
    ['a failed phase', { failedPhases: 1 }],
    ['a failed HTTP call', { httpFailed: 1 }],
    ['failed Elasticsearch checks', { counters: { checks_failed: 1 } }],
    ['failed consistency checks', { counters: { consistency_failed: 2 } }],
    ['documents that failed to load', { counters: { bulk_errors: 3 } }],
    ['NCBI batches that failed', { counters: { batches_failed: 1 } }],
  ])('marks an ok run with %s as having issues', (_, overrides) => {
    expect(runHealth(run(overrides), NOW)).toBe('issues')
  })

  it('takes failures and interruptions as written, and anything else as unknown', () => {
    expect(runHealth(run({}), NOW)).toBe('ok')
    expect(runHealth(run({ status: 'failed' }), NOW)).toBe('failed')
    expect(runHealth(run({ status: 'interrupted' }), NOW)).toBe('interrupted')
    expect(runHealth(run({ status: 'paused' }), NOW)).toBe('unknown')
  })
})

describe('worstHealth', () => {
  it('puts running first, then the certain failures before the doubtful ones', () => {
    expect(worstHealth(['ok', 'issues', 'stale', 'failed'])).toBe('failed')
    expect(worstHealth(['ok', 'running', 'failed'])).toBe('running')
    expect(worstHealth(['ok', 'issues'])).toBe('issues')
    expect(worstHealth([])).toBeNull()
  })
})

describe('buildHealth', () => {
  it('is running while a run runs, or briefly between steps', () => {
    expect(
      buildHealth({ status: 'running', lastActivity: ago(100), runHealths: ['ok', 'running'] }, NOW)
    ).toBe('running')
    expect(buildHealth({ status: 'running', lastActivity: ago(5), runHealths: ['ok'] }, NOW)).toBe(
      'running'
    )
  })

  it('is stale when it says running but nothing has written for a minute', () => {
    expect(
      buildHealth({ status: 'running', lastActivity: ago(120), runHealths: ['ok'] }, NOW)
    ).toBe('stale')
    expect(
      buildHealth({ status: 'running', lastActivity: ago(5), runHealths: ['ok', 'stale'] }, NOW)
    ).toBe('stale')
  })

  it('carries a finished run problem into a finished build', () => {
    expect(
      buildHealth({ status: 'ok', lastActivity: ago(5), runHealths: ['ok', 'issues'] }, NOW)
    ).toBe('issues')
    expect(buildHealth({ status: 'ok', lastActivity: ago(5), runHealths: ['ok'] }, NOW)).toBe('ok')
    expect(buildHealth({ status: 'failed', lastActivity: ago(5), runHealths: ['ok'] }, NOW)).toBe(
      'failed'
    )
    expect(buildHealth({ status: 'odd', lastActivity: ago(5), runHealths: [] }, NOW)).toBe(
      'unknown'
    )
  })
})
