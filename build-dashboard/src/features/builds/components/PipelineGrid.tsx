import { Tooltip } from '@mantine/core'
import { Link } from 'react-router-dom'
import type { BuildSummary, StepCell } from '@/features/builds/model/types'
import { formatDuration } from '@/shared/format'
import { statusLabel, statusStyle } from '@/shared/status'

/** What each step is, for the column headers' tooltips. */
export const STEP_HINTS: Record<string, string> = {
  get_articles: 'Fetches article metadata from NCBI for PMIDs not cached yet',
  clean_annotations: 'Joins the annotations with terms, genes, articles and taxa',
  generate_gene_annotations: 'Groups the annotations by gene',
  report: 'Data figures and consistency checks over the inputs and outputs',
  index_es: 'Recreates the two Elasticsearch indexes and loads them',
  verify: 'Checks the live indexes against the files',
}

const Cell = ({ buildId, cell }: { buildId: string; cell: StepCell }) => {
  const style = statusStyle(cell.state)
  const content = (
    <span
      className={`flex h-full w-full flex-col items-center justify-center gap-0.5 rounded px-1 py-1.5 text-xs ring-1 ${style.tone}`}
    >
      <span className="flex items-center gap-1">
        <style.Icon size={12} aria-hidden="true" />
        {statusLabel(cell.state)}
      </span>
      {cell.durationS !== null && (
        <span className="figures text-2xs opacity-75">{formatDuration(cell.durationS)}</span>
      )}
    </span>
  )
  const hint = `${style.hint}${cell.earlierRuns ? ` Run ${cell.earlierRuns + 1} times; this is the last.` : ''}`
  return (
    <Tooltip label={hint} openDelay={200}>
      {cell.runId ? (
        <Link
          to={`/builds/${encodeURIComponent(buildId)}/runs/${encodeURIComponent(cell.runId)}`}
          className="block h-full no-underline"
          data-state={cell.state}
          aria-label={`${cell.step}: ${statusLabel(cell.state)}`}
        >
          {content}
        </Link>
      ) : (
        <span
          className="block h-full"
          data-state={cell.state}
          aria-label={`${cell.step}: ${statusLabel(cell.state)}`}
        >
          {content}
        </span>
      )}
    </Tooltip>
  )
}

/**
 * Datasets × steps: where the build got to. A cell links to its run; a step without one is still
 * waiting, or never ran because the build stopped first.
 */
export const PipelineGrid = ({ build }: { build: BuildSummary }) => {
  const steps = [...new Set(build.datasets.flatMap(d => d.steps.map(cell => cell.step)))]
  if (!steps.length) return <p className="m-0 text-sm text-gray-500">The build planned no steps.</p>
  return (
    <div className="overflow-x-auto">
      <table
        aria-label="Pipeline"
        className="w-full min-w-[48rem] table-fixed border-separate border-spacing-1 text-sm"
      >
        <thead>
          <tr>
            <th scope="col" className="w-28 text-left text-xs font-medium text-gray-500">
              Dataset
            </th>
            {steps.map(step => (
              <th key={step} scope="col" className="text-xs font-medium break-all text-gray-500">
                <Tooltip label={STEP_HINTS[step] ?? step} openDelay={200}>
                  <span className="font-mono">{step}</span>
                </Tooltip>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {build.datasets.map(dataset => (
            <tr key={dataset.id ?? 'none'}>
              <th scope="row" className="text-left font-medium">
                {dataset.id ? (
                  <Link
                    to={`/builds/${encodeURIComponent(build.buildId)}/datasets/${encodeURIComponent(dataset.id)}`}
                  >
                    {dataset.id}
                  </Link>
                ) : (
                  <span className="text-gray-500">no dataset</span>
                )}
              </th>
              {steps.map(step => {
                const cell = dataset.steps.find(c => c.step === step)
                return (
                  <td key={step} className="h-12 min-w-28 p-0">
                    {cell ? (
                      <Cell buildId={build.buildId} cell={cell} />
                    ) : (
                      <span className="block text-center text-xs text-gray-300">—</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
