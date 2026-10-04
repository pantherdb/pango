import { Button, Loader } from '@mantine/core'
import { FiRefreshCw } from 'react-icons/fi'
import { compareLive } from '@/features/builds/model/live'
import type { LiveRow } from '@/features/builds/model/live'
import type { BuildSummary } from '@/features/builds/model/types'
import { useLazyGetLiveBuildQuery } from '@/features/builds/services/buildsApi'
import { ErrorNotice } from '@/shared/components/Misc'
import { Panel } from '@/shared/components/Panel'
import { Table } from '@/shared/components/Table'
import { ABSENT, formatCount, formatTime } from '@/shared/format'
import { StatusBadge } from '@/shared/status'

const where = (row: LiveRow) => (row.kind === 'es' ? (row.index ?? 'index') : `${row.target} API`)

/**
 * Is the build what is live? On request (it asks real clusters and APIs), the dashboard's server
 * reads the build's own Elasticsearch, and each configured API, and this compares the answers
 * with the build's records. Read-only: counts, index lists and creation times.
 */
export const LivePanel = ({ build }: { build: BuildSummary }) => {
  const [check, { data, error, isFetching }] = useLazyGetLiveBuildQuery()
  const rows = data ? compareLive(build, data.es, data.api) : []
  const problems = rows.filter(row => row.state === 'differs' || row.state === 'missing').length

  return (
    <Panel
      title="Live check"
      subtitle={
        data
          ? `asked at ${formatTime(data.serverTime)}${problems ? ` · ${problems} differ` : ''}`
          : 'Elasticsearch and the APIs, now'
      }
      actions={
        <Button
          size="xs"
          variant="light"
          leftSection={isFetching ? <Loader size={12} /> : <FiRefreshCw aria-hidden="true" />}
          disabled={isFetching}
          onClick={() => check(build.buildId)}
        >
          {data ? 'Check again' : 'Check live now'}
        </Button>
      }
      flush={!!data}
    >
      {error ? (
        <div className="p-3">
          <ErrorNotice title="The live check did not run" error={error} />
        </div>
      ) : !data ? (
        <p className="m-0 text-sm text-gray-600">
          Asks the cluster this build wrote to
          {build.esUrl ? (
            <>
              {' '}
              (<span className="font-mono">{build.esUrl}</span>)
            </>
          ) : (
            ''
          )}{' '}
          whether its indexes still hold what it loaded, and the configured APIs (production by
          default) what they serve for each dataset. Nothing is changed.
        </p>
      ) : (
        <>
          {data.es && (
            <p className="m-0 border-b border-gray-100 px-3 py-2 text-xs text-gray-600">
              Elasticsearch <span className="font-mono">{data.es.url}</span>:{' '}
              {data.es.reachable
                ? `version ${data.es.version ?? ABSENT}, cluster ${data.es.cluster ?? ABSENT}`
                : `no answer (${data.es.error})`}
            </p>
          )}
          <Table<LiveRow>
            label="Live check"
            rows={rows}
            rowKey={row => `${row.kind}:${row.target}:${row.dataset}:${row.what}`}
            empty="This build has no datasets to check."
            columns={[
              { key: 'dataset', header: 'Dataset', cell: row => row.dataset ?? ABSENT },
              {
                key: 'where',
                header: 'Where',
                cell: row => <span className="font-mono text-xs break-all">{where(row)}</span>,
              },
              { key: 'what', header: 'What', cell: row => row.what },
              {
                key: 'expected',
                header: 'This build',
                align: 'right',
                cell: row => formatCount(row.expected),
              },
              { key: 'live', header: 'Live', align: 'right', cell: row => formatCount(row.live) },
              { key: 'state', header: 'Result', cell: row => <StatusBadge status={row.state} /> },
              {
                key: 'note',
                header: 'Note',
                cell: row => <span className="text-xs text-gray-600">{row.note ?? ''}</span>,
              },
            ]}
          />
        </>
      )}
    </Panel>
  )
}
