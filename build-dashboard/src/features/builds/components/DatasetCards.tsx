import { Link } from 'react-router-dom'
import { compareFigure } from '@/features/builds/model/compare'
import type { BuildSummary, DatasetSummary } from '@/features/builds/model/types'
import { Sparkline } from '@/shared/components/charts'
import { formatCount, formatDate, formatDelta } from '@/shared/format'

const HEADLINE: [string, string][] = [
  ['annotations', 'Annotations'],
  ['genes', 'Genes'],
  ['go_terms', 'GO terms'],
  ['slim_terms', 'Slim terms'],
]

export interface DatasetCardsProps {
  build: BuildSummary
  /** The previous build of each dataset, for the changes. */
  previousOf: (dataset: string | null) => BuildSummary | null
  /** The dataset's figures across builds, oldest first, for the trend lines. */
  historyOf: (dataset: string | null, key: string) => number[]
}

const Figure = ({
  label,
  value,
  previous,
  history,
}: {
  label: string
  value: number | null
  previous: number | null
  history: number[]
}) => {
  const delta = previous === null ? null : compareFigure('', label, value, previous)
  const tone =
    !delta || delta.change === 'same'
      ? 'text-gray-500'
      : delta.large
        ? 'text-amber-700'
        : 'text-gray-600'
  return (
    <div className="min-w-[8rem]">
      <div className="text-2xs font-medium tracking-wide text-gray-500 uppercase">{label}</div>
      <div className="flex items-center gap-2">
        <span className="figures text-lg leading-tight font-semibold">{formatCount(value)}</span>
        <Sparkline label={`${label} across builds`} values={history} />
      </div>
      {delta && (
        <div className={`figures text-xs ${tone}`}>{formatDelta(delta.delta, delta.pct)}</div>
      )}
    </div>
  )
}

const DatasetCard = ({
  build,
  dataset,
  previous,
  historyOf,
}: {
  build: BuildSummary
  dataset: DatasetSummary
  previous: BuildSummary | null
  historyOf: DatasetCardsProps['historyOf']
}) => {
  const before = previous?.datasets.find(d => d.id === dataset.id)?.counters ?? null
  const hasReport = 'annotations' in dataset.counters
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-3 shadow-xs">
      <header className="mb-2 flex flex-wrap items-baseline gap-x-2">
        <h3 className="m-0 text-sm font-semibold">
          {dataset.id ? (
            <Link
              to={`/builds/${encodeURIComponent(build.buildId)}/datasets/${encodeURIComponent(dataset.id)}`}
            >
              {dataset.id}
            </Link>
          ) : (
            'no dataset'
          )}
        </h3>
        {typeof dataset.release?.version === 'string' && (
          <span className="text-xs text-gray-500">release {dataset.release.version}</span>
        )}
        <span className="text-xs text-gray-500">
          {previous ? (
            <>
              changes since{' '}
              <Link to={`/builds/${encodeURIComponent(previous.buildId)}`}>
                {previous.label ?? previous.buildId}
              </Link>{' '}
              ({formatDate(previous.asOf)})
            </>
          ) : hasReport ? (
            'no earlier build to compare with'
          ) : null}
        </span>
      </header>
      {hasReport ? (
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {HEADLINE.map(([key, label]) => (
            <Figure
              key={key}
              label={label}
              value={dataset.counters[key] ?? null}
              previous={before ? (before[key] ?? null) : null}
              history={historyOf(dataset.id, key)}
            />
          ))}
        </div>
      ) : (
        <p className="m-0 text-sm text-gray-500">
          No data report in this build
          {dataset.counters.annotations_in_index !== undefined
            ? '; see the Elasticsearch check'
            : ''}
          .
        </p>
      )}
    </section>
  )
}

/** One card per dataset: its headline figures, the change since its previous build, a trend. */
export const DatasetCards = ({ build, previousOf, historyOf }: DatasetCardsProps) => (
  <div className="grid gap-3 lg:grid-cols-2">
    {build.datasets.map(dataset => (
      <DatasetCard
        key={dataset.id ?? 'none'}
        build={build}
        dataset={dataset}
        previous={previousOf(dataset.id)}
        historyOf={historyOf}
      />
    ))}
  </div>
)
