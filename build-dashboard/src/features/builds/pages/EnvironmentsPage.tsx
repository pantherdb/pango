import { Button, Loader } from '@mantine/core'
import { FiRefreshCw } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/features/builds/components/PageParts'
import { builtBy, buildsMatchingCounts } from '@/features/builds/model/live'
import type {
  ApiProbe,
  ApiVersionLive,
  BuildSummary,
  EsIndexLive,
  EsProbe,
} from '@/features/builds/model/types'
import {
  useGetBuildsQuery,
  useGetLiveEnvironmentsQuery,
} from '@/features/builds/services/buildsApi'
import { Code, ErrorNotice, Loading } from '@/shared/components/Misc'
import { Panel } from '@/shared/components/Panel'
import { Table } from '@/shared/components/Table'
import { ABSENT, formatCount, formatTime } from '@/shared/format'
import { StatusBadge } from '@/shared/status'

const BuildLink = ({ build }: { build: BuildSummary }) => (
  <Link to={`/builds/${encodeURIComponent(build.buildId)}`}>{build.label ?? build.buildId}</Link>
)

/** The dataset an index belongs to: the prefix index_es gave it (`pango-2-pango-annotations`). */
const datasetOf = (index: string, builds: BuildSummary[]): string | null => {
  for (const build of builds) {
    for (const dataset of build.datasets) {
      if (dataset.indexes?.annotations === index || dataset.indexes?.genes === index)
        return dataset.id
    }
  }
  return null
}

const EsPanel = ({ probe, builds }: { probe: EsProbe; builds: BuildSummary[] }) => (
  <Panel
    title={<>Elasticsearch · {probe.target}</>}
    subtitle={
      <>
        <span className="font-mono">{probe.url}</span>
        {probe.reachable
          ? ` · version ${probe.version ?? ABSENT}, cluster ${probe.cluster ?? ABSENT}`
          : ''}
      </>
    }
    flush
  >
    {!probe.reachable ? (
      <div className="p-3">
        <StatusBadge status="unreachable" />{' '}
        <span className="text-sm text-gray-600">{probe.error}</span>
      </div>
    ) : (
      <Table<EsIndexLive>
        label={`Indexes on ${probe.target}`}
        rows={probe.indexes}
        rowKey={index => index.name}
        empty="No PAN-GO indexes on this cluster."
        columns={[
          {
            key: 'name',
            header: 'Index',
            cell: index => <span className="font-mono text-xs">{index.name}</span>,
            sortValue: index => index.name,
          },
          {
            key: 'docs',
            header: 'Documents',
            align: 'right',
            cell: index => formatCount(index.docs),
            sortValue: index => index.docs,
          },
          { key: 'health', header: 'Health', cell: index => index.health ?? ABSENT },
          {
            key: 'created',
            header: 'Created',
            cell: index => formatTime(index.createdAt),
            sortValue: index => index.createdAt,
          },
          {
            key: 'build',
            header: 'Built by',
            cell: index => {
              const build = builtBy(builds, datasetOf(index.name, builds), index.createdAt)
              return build ? (
                <BuildLink build={build} />
              ) : (
                <span className="text-xs text-gray-500">no recorded build</span>
              )
            },
          },
        ]}
      />
    )}
  </Panel>
)

/** What `latest` serves, judged by which version's counts it repeats. */
const latestNote = (probe: ApiProbe): string | null => {
  const latest = probe.versions.find(v => v.version === 'latest')
  if (!latest || latest.annotations === null) return null
  const same = probe.versions.filter(
    v => v.version !== 'latest' && v.annotations === latest.annotations && v.genes === latest.genes
  )
  return same.length === 1 ? `serves ${same[0].version}` : null
}

const ApiPanel = ({ probe, builds }: { probe: ApiProbe; builds: BuildSummary[] }) => (
  <Panel
    title={<>API · {probe.target}</>}
    subtitle={<span className="font-mono">{probe.url}</span>}
    flush
  >
    {!probe.reachable ? (
      <div className="p-3">
        <StatusBadge status={probe.blocked ? 'blocked' : 'unreachable'} />{' '}
        <span className="text-sm text-gray-600">{probe.error}</span>
        {probe.blocked && (
          <p className="m-0 mt-2 text-xs text-gray-600">
            The site answers browsers only. To check it from here, its admins can let this host
            through the bot protection; meanwhile compare in a browser, or check the cluster behind
            it as an Elasticsearch target.
          </p>
        )}
      </div>
    ) : (
      <Table<ApiVersionLive>
        label={`Versions on ${probe.target}`}
        rows={probe.versions}
        rowKey={version => version.version}
        columns={[
          {
            key: 'version',
            header: 'Version',
            cell: version => <span className="font-mono text-xs">{version.version}</span>,
          },
          {
            key: 'annotations',
            header: 'Annotations',
            align: 'right',
            cell: version => formatCount(version.annotations),
          },
          {
            key: 'genes',
            header: 'Genes',
            align: 'right',
            cell: version => formatCount(version.genes),
          },
          {
            key: 'match',
            header: 'Counts match',
            cell: version => {
              if (version.error)
                return <span className="text-xs text-red-700">{version.error}</span>
              if (version.version === 'latest')
                return <span className="text-xs text-gray-600">{latestNote(probe) ?? ABSENT}</span>
              const matching = buildsMatchingCounts(
                builds,
                version.version,
                version.annotations,
                version.genes
              )
              return matching.length ? (
                <span className="flex flex-wrap gap-x-2 text-xs">
                  {matching.slice(0, 3).map(build => (
                    <BuildLink key={build.buildId} build={build} />
                  ))}
                  {matching.length > 3 && (
                    <span className="text-gray-500">and {matching.length - 3} more</span>
                  )}
                </span>
              ) : (
                <span className="text-xs text-gray-500">no recorded build</span>
              )
            },
          },
        ]}
      />
    )}
  </Panel>
)

/**
 * What is live where. Each configured Elasticsearch cluster is asked for its PAN-GO indexes; an
 * index whose creation time falls in a build's index_es run was written by that build. Each API
 * is asked how many annotations and genes it serves per version; a build whose report has the same
 * counts "matches", which is weaker: the counts agree, nothing more.
 */
const EnvironmentsPage = () => {
  const builds = useGetBuildsQuery()
  const { data, error, isFetching, refetch } = useGetLiveEnvironmentsQuery()
  const list = builds.data?.builds ?? []

  return (
    <div className="space-y-4">
      <PageHeader title="Environments">
        <p className="m-0 text-sm text-gray-600">
          Read-only: counts, index lists and creation times. The clusters and APIs come from{' '}
          <Code>LIVE_ES_TARGETS</Code> and <Code>LIVE_API_TARGETS</Code> in the dashboard's{' '}
          <Code>.env.local</Code>.
        </p>
      </PageHeader>
      <div className="flex items-center gap-3">
        <Button
          size="xs"
          variant="light"
          leftSection={isFetching ? <Loader size={12} /> : <FiRefreshCw aria-hidden="true" />}
          disabled={isFetching}
          onClick={() => refetch()}
        >
          Check again
        </Button>
        {data && (
          <span className="text-xs text-gray-500">asked at {formatTime(data.serverTime)}</span>
        )}
      </div>
      {error ? (
        <ErrorNotice title="The live check did not run" error={error} />
      ) : !data ? (
        <Loading what="what is live" />
      ) : (
        <>
          {data.es.map(probe => (
            <EsPanel key={probe.target} probe={probe} builds={list} />
          ))}
          {data.api.map(probe => (
            <ApiPanel key={probe.target} probe={probe} builds={list} />
          ))}
        </>
      )}
    </div>
  )
}

export default EnvironmentsPage
