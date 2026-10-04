/**
 * Findings: what a builder should look at, one line each, worded for the person who has to act.
 *
 * The loader records facts (counters, statuses, warnings). These turn the known patterns in them
 * into findings: a failed or stale run, steps a failure kept from running, documents that didn't
 * load, Elasticsearch checks that failed, data the report found inconsistent, NCBI batches lost,
 * and figures that moved a lot since the previous build.
 *
 * Relative imports only (see parse.ts).
 */

import { countOf, formatAgo, formatCount, formatDelta, plural } from '../../../shared/format'
import { WATCHED_FIGURES, compareFigures } from './compare'
import { secondsSince } from './health'
import type { BuildSummary, FindingCounts, Health, RunRecord, RunSummary } from './types'

export type Severity = 'fail' | 'warn' | 'info'

export interface Finding {
  id: string
  severity: Severity
  title: string
  detail: string | null
  /** The run to open for details. */
  runId: string | null
  dataset: string | null
}

const ORDER: Record<Severity, number> = { fail: 0, warn: 1, info: 2 }

export const bySeverity = (a: Finding, b: Finding) => ORDER[a.severity] - ORDER[b.severity]

export const countFindings = (findings: Finding[]): FindingCounts => ({
  fail: findings.filter(f => f.severity === 'fail').length,
  warn: findings.filter(f => f.severity === 'warn').length,
  info: findings.filter(f => f.severity === 'info').length,
})

const named = (dataset: string | null) => dataset ?? 'the dataset'

const runOf = (runs: RunSummary[], dataset: string | null, step: string) =>
  [...runs].reverse().find(run => run.dataset === dataset && run.step === step) ?? null

/** Findings from one dataset's figures (report, verify, index_es and get_articles counters). */
function datasetFindings(
  dataset: string | null,
  counters: Record<string, number>,
  runs: RunSummary[]
): Finding[] {
  const findings: Finding[] = []
  const add = (
    id: string,
    severity: Severity,
    title: string,
    detail: string | null,
    step: string
  ) =>
    findings.push({
      id: `${dataset}:${id}`,
      severity,
      title,
      detail,
      runId: runOf(runs, dataset, step)?.runId ?? null,
      dataset,
    })
  const n = (name: string) => counters[name] ?? 0

  if (n('bulk_errors') > 0) {
    add(
      'bulk-errors',
      'fail',
      `${countOf(n('bulk_errors'), 'document')} failed to load into the ${named(dataset)} indexes`,
      'The indexes are missing them. The index_es run lists the first errors.',
      'index_es'
    )
  }
  if (n('checks_failed') > 0) {
    add(
      'checks-failed',
      'fail',
      `${countOf(n('checks_failed'), 'Elasticsearch check')} failed for ${named(dataset)}`,
      'The live indexes differ from the files the build wrote. The verify run lists each check.',
      'verify'
    )
  }
  if (n('consistency_failed') > 0) {
    add(
      'consistency',
      'warn',
      `${countOf(n('consistency_failed'), 'consistency check')} failed for ${named(dataset)}`,
      "The build's own files disagree with each other. The report run lists which.",
      'report'
    )
  }
  if (n('batches_failed') > 0) {
    add(
      'ncbi',
      'warn',
      `${countOf(n('batches_failed'), 'NCBI batch', 'NCBI batches')} failed for ${named(dataset)}`,
      `${countOf(n('pmids_failed'), 'PMID')} got no article in this build; the next build asks for them again.`,
      'get_articles'
    )
  }
  if (n('references_unresolved') > 0) {
    add(
      'pmids',
      'warn',
      `${countOf(n('references_unresolved'), 'PMID')} cited in ${named(dataset)} ${plural(n('references_unresolved'), 'has', 'have')} no article`,
      'Their evidence shows no reference. Unknown or withdrawn PMIDs, or NCBI batches that failed.',
      'report'
    )
  }
  if (n('annotations_gene_unresolved') > 0) {
    add(
      'genes',
      'warn',
      `${countOf(n('annotations_gene_unresolved'), 'annotation')} in ${named(dataset)} name a gene missing from the gene info`,
      'They load without a symbol or name.',
      'report'
    )
  }
  if (n('with_genes_unresolved') > 0) {
    add(
      'with-genes',
      'warn',
      `${countOf(n('with_genes_unresolved'), 'with-gene')} in ${named(dataset)} ${plural(n('with_genes_unresolved'), 'is', 'are')} missing from the gene info`,
      'clean_annotations fails on these; the report lists them.',
      'report'
    )
  }
  if (n('input_genes_duplicated') > 0) {
    add(
      'duplicates',
      'warn',
      `${countOf(n('input_genes_duplicated'), 'gene id')} ${plural(n('input_genes_duplicated'), 'appears', 'appear')} more than once in the ${named(dataset)} gene info`,
      'The join repeats the annotations of a duplicated gene.',
      'report'
    )
  }
  if (n('pmids_unknown') > 0) {
    add(
      'unknown-pmids',
      'info',
      `NCBI has no summary for ${countOf(n('pmids_unknown'), 'PMID')} cited in ${named(dataset)}`,
      'Unknown or withdrawn. They are asked for again on every build.',
      'get_articles'
    )
  }
  return findings
}

/** Findings for a build, from its summary and its runs' summaries. */
export function buildFindings(build: BuildSummary, runs: RunSummary[], now: Date): Finding[] {
  const findings: Finding[] = []
  const failedRuns = runs.filter(run => run.health === 'failed')

  for (const run of failedRuns) {
    findings.push({
      id: `run:${run.runId}`,
      severity: 'fail',
      title: `${run.step} failed${run.dataset ? ` for ${run.dataset}` : ''}`,
      detail: run.statusReason,
      runId: run.runId,
      dataset: run.dataset,
    })
  }
  if (build.health === 'failed' && failedRuns.length === 0) {
    findings.push({
      id: 'build-failed',
      severity: 'fail',
      title: 'The build failed',
      detail: build.statusReason,
      runId: null,
      dataset: null,
    })
  }
  for (const run of runs.filter(run => run.health === 'stale')) {
    findings.push({
      id: `stale:${run.runId}`,
      severity: 'fail',
      title: `${run.title} stopped reporting ${formatAgo(run.updatedAt, now)}`,
      detail: `It says it is running but writes every ${run.heartbeatS} s. The process was probably killed, or the machine slept.`,
      runId: run.runId,
      dataset: run.dataset,
    })
  }
  if (build.health === 'stale' && !runs.some(run => run.health === 'stale')) {
    findings.push({
      id: 'build-stale',
      severity: 'fail',
      title: `The build stopped ${formatAgo(build.updatedAt, now)}`,
      detail: 'It never recorded how it ended: the script was probably killed between steps.',
      runId: null,
      dataset: null,
    })
  }
  if (build.health === 'interrupted') {
    findings.push({
      id: 'interrupted',
      severity: 'warn',
      title: 'The build was interrupted',
      detail: build.statusReason,
      runId: null,
      dataset: null,
    })
  }

  const notReached = build.datasets.flatMap(d =>
    d.steps.filter(cell => cell.state === 'not_reached').map(cell => `${named(d.id)}: ${cell.step}`)
  )
  if (notReached.length) {
    findings.push({
      id: 'not-reached',
      severity: 'warn',
      title: `${countOf(notReached.length, 'planned step')} never ran`,
      detail: notReached.join(', '),
      runId: null,
      dataset: null,
    })
  }

  for (const dataset of build.datasets)
    findings.push(...datasetFindings(dataset.id, dataset.counters, runs))

  for (const run of runs) {
    // index_es and verify log one error per problem they already report as a finding.
    if (run.errors > 0 && run.health !== 'failed' && !['index_es', 'verify'].includes(run.step)) {
      findings.push({
        id: `errors:${run.runId}`,
        severity: 'warn',
        title: `${countOf(run.errors, 'error')} logged by ${run.title}`,
        detail: null,
        runId: run.runId,
        dataset: run.dataset,
      })
    }
  }

  if (build.datasets.some(d => (d.counters.taxon_id_types_differ ?? 0) > 0)) {
    findings.push({
      id: 'taxon-id',
      severity: 'info',
      title: 'taxon_id is a string in the annotation index and a number in the gene index',
      detail: 'A known issue: pd.read_json re-infers the type when the genes are grouped.',
      runId: null,
      dataset: null,
    })
  }
  if (build.git?.dirty) {
    findings.push({
      id: 'dirty',
      severity: 'info',
      title: 'Ran on uncommitted loader code',
      detail: `Branch ${build.git.branch ?? '?'} at ${build.git.short ?? '?'}, with changes in loader/src or loader/scripts.`,
      runId: null,
      dataset: null,
    })
  }
  if (build.issues.length) {
    findings.push({
      id: 'unreadable',
      severity: 'info',
      title: `${countOf(build.issues.length, 'field')} of build.json could not be read`,
      detail: build.issues.slice(0, 5).join('; '),
      runId: null,
      dataset: null,
    })
  }
  return findings.sort(bySeverity)
}

/** Large changes in the watched figures since the previous build of each dataset. */
export function comparisonFindings(
  build: BuildSummary,
  previousOf: (dataset: string | null) => BuildSummary | null
): Finding[] {
  const findings: Finding[] = []
  for (const dataset of build.datasets) {
    if (!('annotations' in dataset.counters)) continue
    const previous = previousOf(dataset.id)
    const before = previous?.datasets.find(d => d.id === dataset.id)?.counters
    if (!previous || !before) continue
    const moved = compareFigures(dataset.counters, before).filter(
      row => WATCHED_FIGURES.includes(row.key) && row.large
    )
    if (!moved.length) continue
    findings.push({
      id: `${dataset.id}:changed`,
      severity: moved.some(row => row.current === 0 || row.change === 'gone') ? 'fail' : 'warn',
      title: `${named(dataset.id)} changed a lot since ${previous.label ?? previous.buildId}`,
      detail: moved
        .map(row => `${row.label.toLowerCase()} ${formatDelta(row.delta, row.pct)}`)
        .join('; '),
      runId: null,
      dataset: dataset.id,
    })
  }
  return findings
}

/** Findings for one run, from its full record. */
export function runFindings(run: RunRecord, health: Health, now: Date): Finding[] {
  const findings: Finding[] = []
  const add = (id: string, severity: Severity, title: string, detail: string | null = null) =>
    findings.push({ id, severity, title, detail, runId: null, dataset: run.dataset })

  if (health === 'failed') {
    add('failed', 'fail', 'The run failed', run.statusReason ?? run.exception?.message ?? null)
  } else if (health === 'stale') {
    const silent = secondsSince(run.updatedAt, now)
    add(
      'stale',
      'fail',
      `No update since ${formatAgo(run.updatedAt, now)}`,
      `The record says it is running, but it writes every ${run.heartbeatS} s and has been silent for ` +
        `${silent === null ? 'an unknown time' : `${Math.round(silent)} s`}. The process was probably killed, or the machine slept.`
    )
  } else if (health === 'interrupted') {
    add('interrupted', 'warn', 'The run was interrupted', run.statusReason)
  } else if (health === 'unknown') {
    add('unknown', 'warn', 'The run ended without recording an outcome', run.statusReason)
  }
  const failedPhases = run.phases.filter(phase => phase.status === 'failed')
  if (failedPhases.length && health !== 'failed') {
    add(
      'phases',
      'warn',
      `${countOf(failedPhases.length, 'phase')} failed`,
      failedPhases.map(phase => `${phase.name}: ${phase.error ?? 'failed'}`).join('; ')
    )
  }
  if (run.http && run.http.failed > 0) {
    add(
      'http',
      'warn',
      `${formatCount(run.http.failed)} of ${countOf(run.http.calls, 'HTTP call')} failed`,
      Object.entries(run.http.errors)
        .map(([type, e]) => `${type} ×${formatCount(e.count)}`)
        .join('; ') || null
    )
  }
  findings.push(...datasetFindings(run.dataset, run.counters, []).map(f => ({ ...f, runId: null })))
  if (run.logs.error.total > 0 && !['index_es', 'verify'].includes(run.step)) {
    add(
      'errors',
      'warn',
      `${countOf(run.logs.error.total, 'error')} logged`,
      run.logs.error.entries[0]?.message ?? null
    )
  }
  if (run.schema.message)
    add('schema', 'info', 'Record format not fully understood', run.schema.message)
  if (run.issues.length) {
    add(
      'issues',
      'info',
      `${countOf(run.issues.length, 'field')} could not be read`,
      run.issues.slice(0, 5).join('; ')
    )
  }
  const dropped = Object.values(run.dropped).reduce((sum, n) => sum + n, 0)
  if (dropped > 0) {
    add(
      'dropped',
      'info',
      'Some details were left out of the record',
      `Past the recorder's caps: ${Object.entries(run.dropped)
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `${formatCount(n)} ${k.replace(/_/g, ' ')}`)
        .join(', ')}. Totals still count them.`
    )
  }
  return findings.sort(bySeverity)
}
