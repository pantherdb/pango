import { Progress } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FindingsPanel } from '@/features/builds/components/FindingsPanel'
import { Breadcrumbs, LiveNote, PageHeader } from '@/features/builds/components/PageParts'
import {
  ArtifactsPanel,
  CountersPanel,
  EsPanel,
  EventsPanel,
  HttpPanel,
  LogsPanel,
  PhasesPanel,
  ProcessPanel,
} from '@/features/builds/components/RunPanels'
import { SectionPanel } from '@/features/builds/components/SectionPanel'
import { runFindings } from '@/features/builds/model/checks'
import { runHealth } from '@/features/builds/model/health'
import type { RunRecord } from '@/features/builds/model/types'
import {
  useGetBuildQuery,
  useGetEventsQuery,
  useGetRunQuery,
} from '@/features/builds/services/buildsApi'
import { ErrorNotice, Loading } from '@/shared/components/Misc'
import { Panel } from '@/shared/components/Panel'
import { Stat, StatRow } from '@/shared/components/Stat'
import { formatBytes, formatCount, formatDuration, formatTime } from '@/shared/format'
import { StatusBadge } from '@/shared/status'

export const RUN_POLL_MS = 2000

const healthOf = (run: RunRecord, now: Date) =>
  runHealth(
    {
      status: run.status,
      updatedAt: run.updatedAt,
      heartbeatS: run.heartbeatS,
      errors: run.logs.error.total,
      failedPhases: run.phases.filter(phase => phase.status === 'failed').length,
      httpFailed: run.http?.failed ?? 0,
      counters: run.counters,
    },
    now
  )

const ProgressBar = ({ run }: { run: RunRecord }) => {
  const progress = run.progress
  if (!progress?.total) return null
  const fraction = Math.min(1, progress.done / progress.total)
  const amount = (n: number) => (progress.unit === 'bytes' ? formatBytes(n) : formatCount(n))
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600">
        <span>{progress.label ?? 'Progress'}</span>
        <span className="figures">
          {amount(progress.done)} of {amount(progress.total)}
          {progress.unit && progress.unit !== 'bytes' ? ` ${progress.unit}` : ''} ·{' '}
          {Math.round(fraction * 100)} %
        </span>
      </div>
      <Progress
        value={fraction * 100}
        size="sm"
        aria-label={`${progress.label ?? 'Progress'}: ${Math.round(fraction * 100)} %`}
      />
    </div>
  )
}

/** One step process for one dataset: what it did, what it counted, what went wrong. */
const RunPage = () => {
  const { buildId = '', runId = '' } = useParams()
  // Poll only while the run is going on, which the answer itself says.
  const [live, setLive] = useState(false)
  const pollingInterval = live ? RUN_POLL_MS : 0
  const { data, error, isLoading } = useGetRunQuery({ buildId, runId }, { pollingInterval })
  const events = useGetEventsQuery({ buildId, runId }, { pollingInterval, skip: !data })
  // For the breadcrumbs' build label; cached when coming from the build page.
  const build = useGetBuildQuery(buildId)

  const now = useMemo(() => new Date(data?.serverTime ?? Date.now()), [data?.serverTime])
  const run = data?.record
  const health = run ? healthOf(run, now) : null
  useEffect(() => setLive(health === 'running'), [health])
  const findings = useMemo(
    () => (run && health ? runFindings(run, health, now) : []),
    [run, health, now]
  )

  if (isLoading) return <Loading what="the run" />
  if (error || !run || !health)
    return <ErrorNotice title={`Could not load run ${runId}`} error={error} />

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Builds', to: '/' },
          {
            label: build.data?.summary.label ?? run.buildId,
            to: `/builds/${encodeURIComponent(run.buildId)}`,
          },
          ...(run.dataset
            ? [
                {
                  label: run.dataset,
                  to: `/builds/${encodeURIComponent(run.buildId)}/datasets/${encodeURIComponent(run.dataset)}`,
                },
              ]
            : []),
          { label: run.step },
        ]}
      />
      <PageHeader title={run.title} badge={<StatusBadge status={health} />}>
        {run.statusReason && health !== 'ok' && (
          <p className="m-0 text-sm text-red-700">{run.statusReason}</p>
        )}
        <LiveNote
          live={health === 'running'}
          intervalS={RUN_POLL_MS / 1000}
          updatedAt={run.updatedAt}
          now={now}
        />
      </PageHeader>

      <Panel title="Summary">
        <div className="space-y-3">
          <StatRow>
            <Stat
              label="Step"
              value={<span className="font-mono text-base">{run.step}</span>}
              hint={run.dataset ?? undefined}
            />
            <Stat label="Started" value={formatTime(run.startedAt)} />
            <Stat
              label="Took"
              value={formatDuration(run.durationS)}
              hint={health === 'running' ? 'so far' : undefined}
            />
            <Stat label="Phases" value={formatCount(run.phases.length)} />
            <Stat
              label="Warnings"
              value={formatCount(run.logs.warning.total)}
              tone={run.logs.warning.total ? 'warn' : 'default'}
            />
            <Stat
              label="Errors"
              value={formatCount(run.logs.error.total)}
              tone={run.logs.error.total ? 'bad' : 'default'}
            />
          </StatRow>
          {health === 'running' && <ProgressBar run={run} />}
        </div>
      </Panel>

      <FindingsPanel findings={findings} />
      {run.sections.map(section => (
        <SectionPanel key={section.id} section={section} />
      ))}
      <PhasesPanel run={run} now={now} />
      <CountersPanel run={run} />
      <LogsPanel run={run} />
      <HttpPanel run={run} events={events.data?.events ?? []} />
      <EsPanel run={run} />
      <ArtifactsPanel run={run} />
      <ProcessPanel run={run} />
      {events.data && (
        <EventsPanel
          events={events.data.events}
          total={events.data.total}
          eventCount={run.eventCount}
        />
      )}
    </div>
  )
}

export default RunPage
