import { useState } from 'react'
import type { ReactNode } from 'react'
import { BarList } from '@/shared/components/charts'
import { Code, KeyValues } from '@/shared/components/Misc'
import { Panel } from '@/shared/components/Panel'
import { Stat, StatRow } from '@/shared/components/Stat'
import { Table } from '@/shared/components/Table'
import { TimelineChart } from '@/features/builds/components/TimelineChart'
import type {
  Artifact,
  EsOp,
  Ledger,
  LedgerEntry,
  Phase,
  RunEvent,
  RunRecord,
} from '@/features/builds/model/types'
import {
  ABSENT,
  countOf,
  formatBytes,
  formatCount,
  formatDuration,
  formatTime,
  humanize,
  shortHash,
} from '@/shared/format'
import { StatusBadge } from '@/shared/status'

/** The phases of a run: a timeline, then a table with their counters and errors. */
export const PhasesPanel = ({ run, now }: { run: RunRecord; now: Date }) => (
  <Panel title="Phases" subtitle={countOf(run.phases.length, 'phase')}>
    {run.phases.length === 0 ? (
      <p className="m-0 text-sm text-gray-500">The run recorded no phases.</p>
    ) : (
      <div className="space-y-3">
        <TimelineChart
          label="Phase timeline"
          now={now}
          rows={run.phases.map(phase => ({
            id: phase.id,
            label: phase.name,
            segments: [
              {
                id: phase.id,
                startedAt: phase.startedAt,
                finishedAt: phase.finishedAt,
                status: phase.status,
                tip: `${phase.name}: ${formatDuration(phase.durationS)}`,
              },
            ],
          }))}
        />
        <div className="-mx-3">
          <Table<Phase>
            label="Phases"
            rows={run.phases}
            rowKey={phase => phase.id}
            columns={[
              {
                key: 'name',
                header: 'Phase',
                cell: phase => <span className="font-mono text-xs">{phase.name}</span>,
              },
              {
                key: 'status',
                header: 'Status',
                cell: phase => <StatusBadge status={phase.status} />,
              },
              {
                key: 'duration',
                header: 'Duration',
                align: 'right',
                cell: phase => formatDuration(phase.durationS),
                sortValue: phase => phase.durationS,
              },
              {
                key: 'counters',
                header: 'Counted',
                cell: phase =>
                  Object.keys(phase.counters).length ? (
                    <span className="text-xs text-gray-700">
                      {Object.entries(phase.counters)
                        .map(([name, n]) => `${humanize(name)} ${formatCount(n)}`)
                        .join(' · ')}
                    </span>
                  ) : (
                    <span className="text-gray-400">{ABSENT}</span>
                  ),
              },
              {
                key: 'error',
                header: 'Error',
                cell: phase => (
                  <span className="text-xs break-words text-red-700">
                    {phase.error ?? phase.note ?? ''}
                  </span>
                ),
              },
            ]}
          />
        </div>
      </div>
    )}
  </Panel>
)

/** The run's totals, and each breakdown as bars. */
export const CountersPanel = ({ run }: { run: RunRecord }) => {
  const counters = Object.entries(run.counters)
  if (!counters.length) return null
  const breakdowns = Object.entries(run.breakdowns).filter(
    ([, values]) => Object.keys(values).length
  )
  return (
    <Panel title="Counters" subtitle={countOf(counters.length, 'counter')}>
      <div className="space-y-4">
        <dl className="m-0 grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-x-6 gap-y-1 text-sm">
          {counters.map(([name, value]) => (
            <div key={name} className="flex justify-between gap-3 border-b border-gray-100 py-0.5">
              <dt className="font-mono text-xs text-gray-600">{name}</dt>
              <dd className="figures m-0 font-medium">{formatCount(value)}</dd>
            </div>
          ))}
        </dl>
        {breakdowns.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {breakdowns.map(([name, values]) => (
              <div key={name}>
                <h3 className="m-0 mb-1 font-mono text-xs font-semibold text-gray-700">{name}</h3>
                <BarList
                  label={name}
                  data={Object.entries(values).map(([key, value]) => ({ key, value }))}
                  limit={12}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  )
}

const LedgerEntryRow = ({ entry }: { entry: LedgerEntry }) => {
  const [open, setOpen] = useState(false)
  return (
    <li className="border-b border-gray-100 py-1.5 last:border-0">
      <button
        type="button"
        className="flex w-full cursor-pointer items-start gap-2 border-0 bg-transparent p-0 text-left text-sm"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="figures w-12 shrink-0 text-right font-medium">
          ×{formatCount(entry.count)}
        </span>
        <span className="min-w-0 break-words text-gray-900">{entry.message}</span>
        <span className="ml-auto shrink-0 font-mono text-2xs text-gray-500">{entry.logger}</span>
      </button>
      {open && (
        <div className="mt-1 ml-14 space-y-1 text-xs text-gray-600">
          <div>
            {formatTime(entry.firstAt)} to {formatTime(entry.lastAt)} · grouped as{' '}
            <Code>{entry.template}</Code>
          </div>
          {entry.samples.map((sample, i) => (
            <div key={i} className="rounded bg-gray-50 p-1.5">
              <div>
                {formatTime(sample.at)}
                {sample.phase ? ` · ${sample.phase}` : ''}: {sample.message}
              </div>
              {sample.exception && (
                <pre className="m-0 mt-1 overflow-x-auto text-2xs whitespace-pre-wrap">
                  {sample.exception}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </li>
  )
}

const LedgerList = ({ title, ledger, tone }: { title: string; ledger: Ledger; tone: string }) => (
  <div>
    <h3 className={`m-0 mb-1 text-xs font-semibold ${tone}`}>
      {title}: {formatCount(ledger.total)}
      {ledger.overflow > 0 && (
        <span className="font-normal text-gray-500">
          {' '}
          ({formatCount(ledger.overflow)} past the first {ledger.keys} kinds)
        </span>
      )}
    </h3>
    {ledger.entries.length ? (
      <ul className="m-0 list-none p-0">
        {ledger.entries.map(entry => (
          <LedgerEntryRow key={entry.key} entry={entry} />
        ))}
      </ul>
    ) : (
      <p className="m-0 text-sm text-gray-500">None.</p>
    )}
  </div>
)

/** Every WARNING and above, grouped by message; open one for samples and tracebacks. */
export const LogsPanel = ({ run }: { run: RunRecord }) => (
  <Panel
    title="Warnings and errors"
    subtitle={`${formatCount(run.logs.warning.total)} warnings · ${formatCount(run.logs.error.total)} errors`}
  >
    <div className="space-y-4">
      <LedgerList title="Errors" ledger={run.logs.error} tone="text-red-800" />
      <LedgerList title="Warnings" ledger={run.logs.warning} tone="text-amber-800" />
    </div>
  </Panel>
)

/** NCBI calls: totals, failures by kind, latency, and each call from the event log. */
export const HttpPanel = ({ run, events }: { run: RunRecord; events: RunEvent[] }) => {
  if (!run.http) return null
  const http = run.http
  const calls = events.filter(event => event.type === 'http')
  return (
    <Panel title="HTTP calls" subtitle={Object.keys(http.services).join(', ')}>
      <div className="space-y-3">
        <StatRow>
          <Stat label="Calls" value={formatCount(http.calls)} />
          <Stat
            label="Failed"
            value={formatCount(http.failed)}
            tone={http.failed ? 'bad' : 'default'}
          />
          <Stat label="Ids sent" value={formatCount(http.items)} />
          <Stat
            label="Unknown ids"
            value={formatCount(http.unknown)}
            tone={http.unknown ? 'warn' : 'default'}
          />
          <Stat
            label="Latency p50 / p90"
            value={
              http.latencyMs
                ? `${formatCount(http.latencyMs.p50)} / ${formatCount(http.latencyMs.p90)} ms`
                : ABSENT
            }
          />
        </StatRow>
        {Object.entries(http.errors).length > 0 && (
          <ul className="m-0 pl-4 text-sm text-red-800">
            {Object.entries(http.errors).map(([type, error]) => (
              <li key={type}>
                {type} ×{formatCount(error.count)}
                {Object.keys(error.statuses).length
                  ? ` (HTTP ${Object.keys(error.statuses).join(', ')})`
                  : ''}
                : {error.message}
              </li>
            ))}
          </ul>
        )}
        {calls.length > 0 && (
          <div className="-mx-3">
            <Table<RunEvent>
              label="HTTP calls"
              rows={calls}
              rowKey={event => String(event.seq)}
              limit={20}
              columns={[
                { key: 'at', header: 'At', cell: event => formatTime(event.at) },
                {
                  key: 'outcome',
                  header: 'Outcome',
                  cell: event => (
                    <StatusBadge
                      status={event.payload.outcome === 'ok' ? 'ok' : 'failed'}
                      label={String(event.payload.outcome)}
                    />
                  ),
                },
                {
                  key: 'status',
                  header: 'HTTP',
                  align: 'right',
                  cell: event => String(event.payload.status ?? ABSENT),
                },
                {
                  key: 'items',
                  header: 'Ids',
                  align: 'right',
                  cell: event => formatCount(Number(event.payload.items)),
                },
                {
                  key: 'unknown',
                  header: 'Unknown',
                  align: 'right',
                  cell: event => formatCount(Number(event.payload.unknown ?? 0)),
                },
                {
                  key: 'latency',
                  header: 'ms',
                  align: 'right',
                  cell: event => formatCount(Number(event.payload.latency_ms)),
                },
                {
                  key: 'error',
                  header: 'Error',
                  cell: event => (
                    <span className="text-xs text-red-700">
                      {String(event.payload.error ?? '')}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        )}
      </div>
    </Panel>
  )
}

/** The cluster a run wrote to or read, and each operation. */
export const EsPanel = ({ run }: { run: RunRecord }) => {
  if (!run.es) return null
  const { server, ops } = run.es
  return (
    <Panel
      title="Elasticsearch"
      subtitle={
        server ? `${server.cluster ?? ''} · version ${server.version ?? ABSENT}` : undefined
      }
      flush
    >
      <Table<EsOp>
        label="Elasticsearch operations"
        rows={ops}
        rowKey={op => `${op.at}-${op.op}-${op.index}`}
        columns={[
          { key: 'at', header: 'At', cell: op => formatTime(op.at) },
          {
            key: 'op',
            header: 'Operation',
            cell: op => <span className="font-mono text-xs">{op.op}</span>,
          },
          {
            key: 'index',
            header: 'Index',
            cell: op => <span className="font-mono text-xs break-all">{op.index ?? ABSENT}</span>,
          },
          { key: 'status', header: 'Status', cell: op => <StatusBadge status={op.status} /> },
          { key: 'count', header: 'Documents', align: 'right', cell: op => formatCount(op.count) },
          {
            key: 'errors',
            header: 'Errors',
            align: 'right',
            cell: op => (
              <span className={op.errors ? 'font-medium text-red-700' : ''}>
                {formatCount(op.errors)}
              </span>
            ),
          },
          {
            key: 'duration',
            header: 'Took',
            align: 'right',
            cell: op => formatDuration(op.durationS),
          },
        ]}
      />
    </Panel>
  )
}

/** Files the run wrote: size, records and checksum. */
export const ArtifactsPanel = ({ run }: { run: RunRecord }) =>
  run.artifacts.length ? (
    <Panel title="Files written" subtitle={countOf(run.artifacts.length, 'file')} flush>
      <Table<Artifact>
        label="Files written"
        rows={run.artifacts}
        rowKey={artifact => `${artifact.path}-${artifact.at}`}
        columns={[
          { key: 'role', header: 'What', cell: a => a.role ?? ABSENT },
          {
            key: 'path',
            header: 'Path',
            cell: a => <span className="font-mono text-xs break-all">{a.path}</span>,
          },
          {
            key: 'records',
            header: 'Records',
            align: 'right',
            cell: a => formatCount(a.records),
            sortValue: a => a.records,
          },
          {
            key: 'bytes',
            header: 'Size',
            align: 'right',
            cell: a => formatBytes(a.bytes),
            sortValue: a => a.bytes,
          },
          {
            key: 'sha',
            header: 'SHA-256',
            cell: a => <span className="font-mono text-xs">{shortHash(a.sha256)}</span>,
          },
        ]}
      />
    </Panel>
  ) : null

/** How the run was started: its command, process and arguments. */
export const ProcessPanel = ({ run }: { run: RunRecord }) => (
  <Panel title="How it ran">
    <div className="grid gap-4 lg:grid-cols-2">
      <KeyValues
        items={[
          ['Command', <Code key="argv">{run.process.argv.join(' ') || ABSENT}</Code>],
          [
            'Working dir',
            <span key="cwd" className="font-mono text-xs">
              {run.process.cwd ?? ABSENT}
            </span>,
          ],
          [
            'Process',
            `pid ${run.process.pid ?? ABSENT} on ${run.host.name ?? ABSENT} (${run.host.platform ?? ABSENT}, Python ${run.host.python ?? ABSENT})`,
          ],
          ['Started', formatTime(run.startedAt)],
          ['Finished', formatTime(run.finishedAt)],
          ['Exit code', run.exitCode === null ? ABSENT : String(run.exitCode)],
        ]}
      />
      <KeyValues
        items={Object.entries(run.config).map(([key, value]): [string, ReactNode] => [
          key,
          <span key={key} className="font-mono text-xs break-all">
            {typeof value === 'object' ? JSON.stringify(value) : String(value ?? ABSENT)}
          </span>,
        ])}
      />
    </div>
    {run.exception && (
      <div className="mt-3">
        <h3 className="m-0 mb-1 text-xs font-semibold text-red-800">
          {run.exception.type}: {run.exception.message}
        </h3>
        <pre className="m-0 max-h-80 overflow-auto rounded bg-gray-900 p-2 text-2xs text-gray-100">
          {run.exception.traceback}
        </pre>
      </div>
    )}
  </Panel>
)

const eventSummary = (event: RunEvent): string => {
  const p = event.payload
  switch (event.type) {
    case 'phase.start':
      return String(p.name)
    case 'phase.end':
      return `${p.name}: ${p.status} in ${formatDuration(Number(p.duration_s))}${p.error ? ` (${p.error})` : ''}`
    case 'progress':
      return `${p.label ?? ''} ${formatCount(Number(p.done))} of ${formatCount(Number(p.total))} ${p.unit ?? ''}`
    case 'log':
      return `${p.level}: ${p.message}`
    case 'http':
      return `${p.service} ${p.outcome}${p.status ? ` (HTTP ${p.status})` : ''}, ${formatCount(Number(p.items))} ids`
    case 'es':
      return `${p.op} ${p.index ?? ''}${p.count !== null && p.count !== undefined ? ` · ${formatCount(Number(p.count))} docs` : ''}`
    case 'artifact':
      return `${p.role}: ${p.path}`
    case 'run.end':
      return `${p.status}${p.reason ? `: ${p.reason}` : ''}`
    default:
      return Object.entries(p)
        .filter(([, v]) => v !== null && typeof v !== 'object')
        .map(([k, v]) => `${k} ${v}`)
        .join(' · ')
  }
}

/** The run's events.jsonl, in order. */
export const EventsPanel = ({
  events,
  total,
  eventCount,
}: {
  events: RunEvent[]
  total: number
  eventCount: number
}) => (
  <Panel
    title="Event log"
    subtitle={`${formatCount(total)} of ${formatCount(eventCount)} events`}
    flush
  >
    <Table<RunEvent>
      label="Event log"
      rows={events}
      rowKey={event => String(event.seq)}
      limit={50}
      columns={[
        { key: 'seq', header: '#', align: 'right', cell: event => String(event.seq) },
        {
          key: 'at',
          header: 'At',
          cell: event => <span className="whitespace-nowrap">{formatTime(event.at)}</span>,
        },
        {
          key: 'type',
          header: 'Event',
          cell: event => <span className="font-mono text-xs">{event.type}</span>,
        },
        {
          key: 'what',
          header: 'What',
          cell: event => <span className="text-xs break-words">{eventSummary(event)}</span>,
        },
      ]}
    />
  </Panel>
)
