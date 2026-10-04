import type { Section, SectionTable } from '@/features/builds/model/types'
import { Panel } from '@/shared/components/Panel'
import { Stat, StatRow } from '@/shared/components/Stat'
import { Table } from '@/shared/components/Table'
import { ABSENT, formatBytes, formatCount, formatTime, humanize } from '@/shared/format'
import { StatusBadge } from '@/shared/status'

const ISO_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/

const cellText = (key: string, value: unknown, numeric: boolean) => {
  if (value === null || value === undefined || value === '') return ABSENT
  if (typeof value === 'boolean')
    return <StatusBadge status={value ? 'ok' : 'failed'} label={value ? 'Yes' : 'No'} />
  if (key === 'bytes' && typeof value === 'number') return formatBytes(value)
  if (numeric && typeof value === 'number') return formatCount(value)
  if (typeof value === 'string' && ISO_TIME.test(value)) return formatTime(value)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** Tables wider than this many columns take the panel's whole width. */
const NARROW_COLUMNS = 3

interface IndexedRow {
  row: Record<string, unknown>
  index: number
}

export const SectionTableView = ({
  table,
  limit = 25,
}: {
  table: SectionTable
  limit?: number
}) => {
  const columns = table.columns.length
    ? table.columns
    : Object.keys(table.rows[0] ?? {}).map(key => ({
        key,
        label: humanize(key),
        kind: 'text' as const,
      }))
  return (
    <div className={`min-w-0 ${columns.length > NARROW_COLUMNS ? 'xl:col-span-2' : ''}`}>
      {table.title && (
        <h3 className="m-0 mb-1 px-3 text-xs font-semibold text-gray-700">{table.title}</h3>
      )}
      <Table<IndexedRow>
        label={table.title || table.id}
        rows={table.rows.map((row, index) => ({ row, index }))}
        rowKey={item => String(item.index)}
        limit={limit}
        columns={columns.map(column => ({
          key: column.key,
          header: column.label,
          align: column.kind === 'number' ? ('right' as const) : undefined,
          cell: item => cellText(column.key, item.row[column.key], column.kind === 'number'),
          className: column.kind === 'number' ? undefined : 'break-words max-w-[28rem]',
          sortValue: item => {
            const value = item.row[column.key]
            return typeof value === 'number' || typeof value === 'string' ? value : null
          },
        }))}
      />
      {table.totalRows > table.rows.length && (
        <p className="m-0 px-3 text-xs text-gray-500">
          The record kept {formatCount(table.rows.length)} of {formatCount(table.totalRows)} rows.
        </p>
      )}
    </div>
  )
}

/**
 * A report a run attached (`run.section(...)` in the loader): the generic shape any step can fill,
 * so a new report shows up here without dashboard changes.
 */
export const SectionPanel = ({
  section,
  omitTables = [],
}: {
  section: Section
  omitTables?: string[]
}) => {
  const tables = section.tables.filter(table => !omitTables.includes(table.id))
  return (
    <Panel title={section.title} subtitle={<span className="font-mono">{section.id}</span>}>
      {section.status !== 'ok' ? (
        <p className="m-0 text-sm text-amber-800">
          This report is {section.status}
          {section.message ? `: ${section.message}` : '.'}
        </p>
      ) : (
        <div className="space-y-4">
          {section.headline.length > 0 && (
            <StatRow>
              {section.headline.map(([label, value]) => (
                <Stat
                  key={label}
                  label={label}
                  value={typeof value === 'number' ? formatCount(value) : (value ?? ABSENT)}
                />
              ))}
            </StatRow>
          )}
          {section.text && <p className="m-0 text-sm break-words text-gray-700">{section.text}</p>}
          {tables.length > 0 && (
            <div className="-mx-3 grid gap-4 xl:grid-cols-2">
              {tables.map(table => (
                <SectionTableView key={table.id} table={table} />
              ))}
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}
