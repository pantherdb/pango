import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { countOf } from '@/shared/format'

export interface Column<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Makes the column sortable. */
  sortValue?: (row: T) => number | string | null
  align?: 'left' | 'right'
  /** Tailwind classes for the cells of this column. */
  className?: string
}

export interface TableProps<T> {
  /** The table's accessible name. */
  label: string
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  initialSort?: { key: string; desc: boolean }
  /** Show this many rows, with a button for the rest. */
  limit?: number
  empty?: ReactNode
}

/** A sortable table of figures: numbers right-aligned in tabular digits, nulls last either way. */
export function Table<T>({
  label,
  rows,
  columns,
  rowKey,
  initialSort,
  limit,
  empty,
}: TableProps<T>) {
  const [sort, setSort] = useState(initialSort ?? null)
  const [all, setAll] = useState(false)

  const sorted = useMemo(() => {
    const column = sort ? columns.find(c => c.key === sort.key) : undefined
    if (!sort || !column?.sortValue) return rows
    const value = column.sortValue
    return [...rows].sort((a, b) => {
      const x = value(a)
      const y = value(b)
      if (x === y) return 0
      if (x === null) return 1
      if (y === null) return -1
      const order =
        typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
      return sort.desc ? -order : order
    })
  }, [rows, columns, sort])

  if (!rows.length)
    return <p className="m-0 p-3 text-sm text-gray-500">{empty ?? 'Nothing recorded.'}</p>
  const shown = limit && !all ? sorted.slice(0, limit) : sorted

  return (
    <div className="overflow-x-auto">
      <table aria-label={label} className="figures w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
            {columns.map(column => {
              const active = sort?.key === column.key
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={active ? (sort.desc ? 'descending' : 'ascending') : undefined}
                  className={`px-3 py-1.5 font-medium whitespace-nowrap ${column.align === 'right' ? 'text-right' : ''}`}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center gap-0.5 border-0 bg-transparent p-0 font-medium text-inherit hover:text-gray-900"
                      onClick={() => setSort({ key: column.key, desc: active ? !sort.desc : true })}
                    >
                      {column.header}
                      {active &&
                        (sort.desc ? <FiChevronDown aria-hidden /> : <FiChevronUp aria-hidden />)}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {shown.map(row => (
            <tr
              key={rowKey(row)}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
            >
              {columns.map(column => (
                <td
                  key={column.key}
                  className={`px-3 py-1.5 align-top ${column.align === 'right' ? 'text-right whitespace-nowrap' : ''} ${column.className ?? ''}`}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {limit && rows.length > limit && (
        <button
          type="button"
          className="m-2 cursor-pointer border-0 bg-transparent text-xs text-blue-800 hover:underline"
          onClick={() => setAll(!all)}
        >
          {all ? `Show the first ${limit}` : `Show all ${countOf(rows.length, 'row')}`}
        </button>
      )}
    </div>
  )
}
