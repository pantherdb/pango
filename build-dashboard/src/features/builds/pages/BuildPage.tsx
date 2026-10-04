import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DatasetCards } from '@/features/builds/components/DatasetCards'
import { FindingsPanel } from '@/features/builds/components/FindingsPanel'
import { LivePanel } from '@/features/builds/components/LivePanel'
import {
  Breadcrumbs,
  LiveNote,
  PageHeader,
  UnreadableNotice,
} from '@/features/builds/components/PageParts'
import { PipelineGrid } from '@/features/builds/components/PipelineGrid'
import { TimelineChart } from '@/features/builds/components/TimelineChart'
import { buildFindings, bySeverity, comparisonFindings } from '@/features/builds/model/checks'
import { byBuildDateDesc, previousBuild } from '@/features/builds/model/summary'
import type { BuildRecord, Fingerprint } from '@/features/builds/model/types'
import { useGetBuildQuery, useGetBuildsQuery } from '@/features/builds/services/buildsApi'
import { Code, ErrorNotice, KeyValues, Loading } from '@/shared/components/Misc'
import { Panel } from '@/shared/components/Panel'
import { Stat, StatRow } from '@/shared/components/Stat'
import { Table } from '@/shared/components/Table'
import {
  ABSENT,
  formatBytes,
  formatCount,
  formatDuration,
  formatTime,
  shortHash,
} from '@/shared/format'
import { StatusBadge } from '@/shared/status'

export const BUILD_POLL_MS = 2000

interface InputRow extends Fingerprint {
  dataset: string
}

const InputsPanel = ({ record }: { record: BuildRecord }) => {
  const rows: InputRow[] = [
    ...record.sharedInputs.map(print => ({ ...print, dataset: 'all' })),
    ...record.datasets.flatMap(dataset =>
      dataset.inputs.map(print => ({ ...print, dataset: dataset.id ?? ABSENT }))
    ),
  ]
  return (
    <Panel title="Inputs" subtitle="as they were when the build began" flush>
      <Table<InputRow>
        label="Inputs"
        rows={rows}
        rowKey={row => `${row.dataset}:${row.path}`}
        empty="The build recorded no input files."
        columns={[
          { key: 'dataset', header: 'Dataset', cell: row => row.dataset },
          { key: 'role', header: 'What', cell: row => row.role ?? ABSENT },
          {
            key: 'path',
            header: 'Path',
            cell: row => <span className="font-mono text-xs break-all">{row.path}</span>,
          },
          {
            key: 'bytes',
            header: 'Size',
            align: 'right',
            cell: row => formatBytes(row.bytes),
            sortValue: row => row.bytes,
          },
          { key: 'modified', header: 'Modified', cell: row => formatTime(row.modifiedAt) },
          {
            key: 'sha',
            header: 'SHA-256',
            cell: row => <span className="font-mono text-xs">{shortHash(row.sha256)}</span>,
          },
        ]}
      />
    </Panel>
  )
}

const ProvenancePanel = ({ record }: { record: BuildRecord }) => (
  <Panel title="How it ran">
    <div className="grid gap-4 lg:grid-cols-2">
      <KeyValues
        items={[
          ['Command', <Code key="argv">{record.process.argv.join(' ') || ABSENT}</Code>],
          [
            'Working dir',
            <span key="cwd" className="font-mono text-xs">
              {record.process.cwd ?? ABSENT}
            </span>,
          ],
          [
            'Host',
            `${record.host.name ?? ABSENT} (${record.host.platform ?? ABSENT}, Python ${record.host.python ?? ABSENT})`,
          ],
          [
            'Loader code',
            record.git
              ? `${record.git.branch ?? 'detached'} at ${record.git.short ?? ABSENT}${record.git.dirty ? ', with uncommitted changes' : ''}`
              : ABSENT,
          ],
          [
            'Libraries',
            Object.entries(record.packages)
              .map(([name, version]) => `${name} ${version ?? '?'}`)
              .join(', ') || ABSENT,
          ],
        ]}
      />
      <KeyValues
        items={Object.entries(record.config).map(([key, value]) => [
          key,
          <span key={key} className="font-mono text-xs break-all">
            {String(value ?? ABSENT)}
          </span>,
        ])}
      />
    </div>
  </Panel>
)

const BuildPage = () => {
  const { buildId = '' } = useParams()
  // Poll only while the build is going on, which the answer itself says.
  const [live, setLive] = useState(false)
  const { data, error, isLoading } = useGetBuildQuery(buildId, {
    pollingInterval: live ? BUILD_POLL_MS : 0,
  })
  useEffect(() => setLive(data?.summary.live ?? false), [data?.summary.live])
  const builds = useGetBuildsQuery(undefined, { pollingInterval: live ? BUILD_POLL_MS * 2 : 0 })

  const now = useMemo(() => new Date(data?.serverTime ?? Date.now()), [data?.serverTime])
  const others = useMemo(
    () => [...(builds.data?.builds ?? [])].sort(byBuildDateDesc),
    [builds.data]
  )

  if (isLoading) return <Loading what="the build" />
  if (error || !data) return <ErrorNotice title={`Could not load build ${buildId}`} error={error} />

  const { summary, record, runs } = data
  const previousOf = (dataset: string | null) => previousBuild(others, summary, dataset)
  const historyOf = (dataset: string | null, key: string) =>
    [...others]
      .reverse()
      .filter(build => (build.asOf ?? '') <= (summary.asOf ?? ''))
      .flatMap(build =>
        build.datasets
          .filter(d => d.id === dataset && typeof d.counters[key] === 'number')
          .map(d => d.counters[key])
      )
  const findings = [
    ...buildFindings(summary, runs, now),
    ...comparisonFindings(summary, previousOf),
  ].sort(bySeverity)
  const datasets = [...new Set(runs.map(run => run.dataset))]

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[{ label: 'Builds', to: '/' }, { label: summary.label ?? summary.buildId }]}
      />
      <PageHeader
        title={summary.label ?? summary.buildId}
        badge={<StatusBadge status={summary.health} />}
      >
        {summary.label && <p className="m-0 font-mono text-xs text-gray-500">{summary.buildId}</p>}
        {summary.statusReason && summary.health !== 'ok' && (
          <p className="m-0 text-sm text-red-700">{summary.statusReason}</p>
        )}
        <LiveNote
          live={summary.live}
          intervalS={BUILD_POLL_MS / 1000}
          updatedAt={summary.updatedAt}
          now={now}
        />
      </PageHeader>
      <UnreadableNotice items={data.unreadable} />

      <Panel title="Summary">
        <StatRow>
          <Stat
            label="Script"
            value={record.script}
            hint={record.script === 'backfill' ? 'a report over existing outputs' : undefined}
          />
          <Stat label="Started" value={formatTime(summary.startedAt)} />
          <Stat
            label="Took"
            value={formatDuration(summary.durationS)}
            hint={summary.live ? 'so far' : undefined}
          />
          <Stat label="Datasets" value={formatCount(summary.datasets.length)} />
          <Stat label="Runs" value={formatCount(summary.runs)} />
          <Stat
            label="Warnings"
            value={formatCount(summary.warnings)}
            tone={summary.warnings ? 'warn' : 'default'}
          />
          <Stat
            label="Errors"
            value={formatCount(summary.errors)}
            tone={summary.errors ? 'bad' : 'default'}
          />
          <Stat
            label="Elasticsearch"
            value={<span className="font-mono text-sm">{summary.esUrl ?? ABSENT}</span>}
          />
        </StatRow>
      </Panel>

      <FindingsPanel findings={findings} buildId={summary.buildId} />
      <Panel title="Pipeline" subtitle="each dataset's steps; a cell opens its run">
        <PipelineGrid build={summary} />
      </Panel>
      <DatasetCards build={summary} previousOf={previousOf} historyOf={historyOf} />
      <LivePanel build={summary} />
      <Panel title="Timeline" subtitle="runs on one axis; rows are datasets">
        <TimelineChart
          label="Build timeline"
          now={now}
          rows={datasets.map(dataset => ({
            id: dataset ?? 'none',
            label: dataset ?? 'no dataset',
            segments: runs
              .filter(run => run.dataset === dataset)
              .map(run => ({
                id: run.runId,
                startedAt: run.startedAt,
                finishedAt: run.finishedAt ?? (run.health === 'running' ? null : run.updatedAt),
                status: run.health,
                tip: `${run.step}: ${formatDuration(run.durationS)}`,
              })),
          }))}
        />
      </Panel>
      <InputsPanel record={record} />
      <ProvenancePanel record={record} />
    </div>
  )
}

export default BuildPage
