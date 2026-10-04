import { Link } from 'react-router-dom'
import { PageHeader, UnreadableNotice } from '@/features/builds/components/PageParts'
import type { BuildSummary } from '@/features/builds/model/types'
import { useGetBuildsQuery } from '@/features/builds/services/buildsApi'
import { Code, EmptyState, ErrorNotice, Loading } from '@/shared/components/Misc'
import { Panel } from '@/shared/components/Panel'
import { Table } from '@/shared/components/Table'
import type { Column } from '@/shared/components/Table'
import {
  countOf,
  formatAgo,
  formatCount,
  formatDate,
  formatDuration,
  formatTime,
} from '@/shared/format'
import { SEVERITY, StatusBadge } from '@/shared/status'

/** New builds appear without a reload; the list is cheap to fetch. */
export const BUILDS_POLL_MS = 5000

const SCRIPTS: Record<string, string> = {
  all: 'full build',
  index_only: 're-index',
  adhoc: 'one step',
  backfill: 'backfill',
}

const DatasetFigures = ({ build }: { build: BuildSummary }) => (
  <ul className="m-0 list-none space-y-0.5 p-0 text-xs">
    {build.datasets.map(dataset => (
      <li key={dataset.id ?? 'none'} className="whitespace-nowrap">
        <span className="font-medium">{dataset.id ?? 'no dataset'}</span>
        {'annotations' in dataset.counters ? (
          <span className="figures text-gray-600">
            {' '}
            · {formatCount(dataset.counters.annotations)} annotations ·{' '}
            {formatCount(dataset.counters.genes)} genes
          </span>
        ) : null}
      </li>
    ))}
  </ul>
)

const Findings = ({ build }: { build: BuildSummary }) => {
  const parts = (['fail', 'warn', 'info'] as const).filter(severity => build.findings[severity] > 0)
  if (!parts.length) return <span className="text-xs text-gray-400">none</span>
  return (
    <span className="flex gap-2 text-xs">
      {parts.map(severity => {
        const { Icon, tone, label } = SEVERITY[severity]
        return (
          <span key={severity} className={`flex items-center gap-0.5 ${tone}`} title={label}>
            <Icon aria-label={label} />
            {build.findings[severity]}
          </span>
        )
      })}
    </span>
  )
}

const BuildsPage = () => {
  const { data, error, isLoading } = useGetBuildsQuery(undefined, {
    pollingInterval: BUILDS_POLL_MS,
  })
  if (isLoading) return <Loading what="the builds" />
  if (error || !data) return <ErrorNotice title="Could not load the builds" error={error} />
  const now = new Date(data.serverTime)

  const columns: Column<BuildSummary>[] = [
    {
      key: 'build',
      header: 'Build',
      cell: build => (
        <div className="min-w-0">
          <Link
            to={`/builds/${encodeURIComponent(build.buildId)}`}
            className="font-medium break-all"
          >
            {build.label ?? build.buildId}
          </Link>
          <div className="text-xs text-gray-500">
            {SCRIPTS[build.script] ?? build.script}
            {build.label ? (
              <>
                {' '}
                · <span className="font-mono">{build.buildId}</span>
              </>
            ) : null}
          </div>
        </div>
      ),
      sortValue: build => build.label ?? build.buildId,
    },
    {
      key: 'status',
      header: 'Status',
      cell: build => <StatusBadge status={build.health} />,
      sortValue: build => build.health,
    },
    {
      key: 'started',
      header: 'Started',
      cell: build => (
        <div className="whitespace-nowrap">
          {build.script === 'backfill' ? (
            <>data of {formatDate(build.asOf)}</>
          ) : (
            formatTime(build.startedAt)
          )}
          <div className="text-xs text-gray-500">{formatAgo(build.startedAt, now)}</div>
        </div>
      ),
      sortValue: build => build.asOf ?? build.startedAt,
    },
    {
      key: 'duration',
      header: 'Took',
      align: 'right',
      cell: build => formatDuration(build.durationS),
      sortValue: build => build.durationS,
    },
    { key: 'datasets', header: 'Datasets', cell: build => <DatasetFigures build={build} /> },
    {
      key: 'findings',
      header: 'To look at',
      cell: build => <Findings build={build} />,
      sortValue: build => build.findings.fail * 1000 + build.findings.warn,
    },
    {
      key: 'runs',
      header: 'Runs',
      align: 'right',
      cell: build => formatCount(build.runs),
      sortValue: build => build.runs,
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Builds">
        <p className="m-0 text-sm text-gray-600">
          Reading <Code>{data.buildsDir}</Code>. Every <Code>loader/scripts/all.sh</Code> or{' '}
          <Code>run_index_es.sh</Code> run records itself there as it goes.
        </p>
      </PageHeader>
      <UnreadableNotice items={data.unreadable} />
      {data.builds.length === 0 ? (
        <EmptyState title="No builds recorded yet">
          Run a build from <Code>loader/</Code>, for example{' '}
          <Code>
            uv run bash scripts/all.sh -i ./downloads/input -a ./downloads/clean-articles.json -o
            ./downloads/output
          </Code>
          , and it appears here within seconds. To read another folder, start the dashboard with{' '}
          <Code>PANGO_BUILDS_DIR</Code> set.
        </EmptyState>
      ) : (
        <Panel title="Builds" subtitle={countOf(data.builds.length, 'build')} flush>
          <Table
            label="Builds"
            rows={data.builds}
            columns={columns}
            rowKey={build => build.buildId}
          />
        </Panel>
      )}
    </div>
  )
}

export default BuildsPage
