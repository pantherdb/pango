// @vitest-environment node
import {
  datasetPlans,
  previousBuild,
  stepCells,
  summarizeRun,
} from '@/features/builds/model/summary'
import { parseBuild, parseRun } from '@/features/builds/model/parse'
import type { BuildSummary, RunSummary } from '@/features/builds/model/types'
import { FIXTURE_NOW } from '@tests/mocks/api'
import { FIXTURES } from '@tests/mocks/upstream'
import { createBuildsStore } from '../../../../server/buildsStore'

const store = createBuildsStore({ buildsDir: FIXTURES, now: () => FIXTURE_NOW })
const { builds } = store.builds()
const named = (label: string) => builds.find(build => build.label?.startsWith(label))!
const states = (build: BuildSummary, dataset: string) =>
  Object.fromEntries(
    build.datasets.find(d => d.id === dataset)!.steps.map(cell => [cell.step, cell.state])
  )

describe('build summaries over the fixtures', () => {
  it('lists builds newest first by the date their data describes, backfills last', () => {
    expect(builds.map(build => build.label)).toEqual([
      'Running build (synthetic)',
      'NCBI trouble (synthetic)',
      'Failed build (synthetic)',
      'Killed build (synthetic)',
      'pango-1 + pango-2 full-data capture',
      'pango-test fixture capture',
      'pango-2 as built in January 2026 (backfill)',
      'pango-1 as built in January 2026 (backfill)',
    ])
  })

  it('shows where a failed build stopped', () => {
    const failed = named('Failed build')
    expect(failed.health).toBe('failed')
    expect(states(failed, 'pango-1')).toEqual({
      get_articles: 'ok',
      clean_annotations: 'ok',
      generate_gene_annotations: 'ok',
      report: 'ok',
      index_es: 'ok',
      verify: 'ok',
    })
    expect(states(failed, 'pango-2')).toMatchObject({ index_es: 'failed', verify: 'not_reached' })
  })

  it('shows what a running build has still to do', () => {
    const running = named('Running build')
    expect([running.health, running.live]).toEqual(['running', true])
    expect(states(running, 'pango-1')).toMatchObject({
      get_articles: 'ok',
      clean_annotations: 'running',
      report: 'pending',
    })
    expect(Object.values(states(running, 'pango-2'))).toEqual(Array(6).fill('pending'))
  })

  it('calls a killed build stale and its unrun steps not reached', () => {
    const killed = named('Killed build')
    expect([killed.health, killed.live]).toEqual(['stale', false])
    expect(states(killed, 'pango-2')).toMatchObject({ index_es: 'stale', verify: 'not_reached' })
  })

  it("gives each dataset its report's and verify's counters", () => {
    const full = named('pango-1 + pango-2')
    const pango2 = full.datasets.find(d => d.id === 'pango-2')!
    expect(pango2.counters).toMatchObject({
      annotations: 86886,
      genes: 20580,
      checks: 13,
      checks_failed: 0,
      docs_indexed: 107466,
    })
    // clean_annotations counts the gene info as `genes`; only the report's genes count.
    expect(pango2.counters.genes).toBe(20580)
  })

  it('counts findings for the list', () => {
    expect(named('Failed build').findings.fail).toBe(2)
    expect(named('pango-test').findings).toEqual({ fail: 0, warn: 0, info: 2 })
  })
})

describe('previousBuild', () => {
  it('is the latest earlier build with a report for the dataset', () => {
    const full = named('pango-1 + pango-2')
    expect(previousBuild(builds, full, 'pango-1')?.label).toBe(
      'pango-1 as built in January 2026 (backfill)'
    )
    expect(previousBuild(builds, named('NCBI trouble'), 'pango-1')?.label).toBe(
      'Failed build (synthetic)'
    )
    expect(previousBuild(builds, named('pango-test'), 'pango-test')).toBeNull()
  })
})

describe('stepCells', () => {
  const run = (step: string, startedAt: string): RunSummary =>
    ({
      runId: `${step}-${startedAt}`,
      step,
      dataset: 'd',
      startedAt,
      health: 'ok',
      finishedAt: null,
      durationS: 1,
    }) as RunSummary

  it('shows the last run of a step run twice, and counts the earlier one', () => {
    const cells = stepCells(
      ['report'],
      [run('report', '2026-10-04T10:00:00Z'), run('report', '2026-10-04T11:00:00Z')],
      'd',
      false
    )
    expect(cells).toEqual([
      expect.objectContaining({
        step: 'report',
        runId: 'report-2026-10-04T11:00:00Z',
        earlierRuns: 1,
      }),
    ])
  })

  it('adds steps that ran without being planned', () => {
    expect(
      stepCells(['report'], [run('verify', '2026-10-04T10:00:00Z')], 'd', true).map(c => [
        c.step,
        c.state,
      ])
    ).toEqual([
      ['report', 'pending'],
      ['verify', 'ok'],
    ])
  })
})

describe('datasetPlans', () => {
  it("names a one-run build's dataset from its run while the run is going", () => {
    const build = parseBuild({
      schema_version: 1,
      build_id: 'b',
      datasets: [{ id: null, steps: ['index_es'], inputs: [] }],
    })
    const summary = summarizeRun(
      parseRun({
        schema_version: 1,
        run_id: 'r',
        step: 'index_es',
        dataset: 'pango-2',
        status: 'running',
      }),
      FIXTURE_NOW
    )
    expect(datasetPlans(build, [summary]).map(plan => [plan.id, plan.steps])).toEqual([
      ['pango-2', ['index_es']],
    ])
  })
})
