import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'
import { formatAgo } from '@/shared/format'

export interface Crumb {
  label: string
  to?: string
}

export const Breadcrumbs = ({ items }: { items: Crumb[] }) => (
  <nav aria-label="Breadcrumbs" className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
    {items.map((item, i) => (
      <span key={`${item.label}-${i}`} className="flex items-center gap-1">
        {i > 0 && <FiChevronRight aria-hidden="true" />}
        {item.to ? (
          <Link to={item.to} className="no-underline hover:underline">
            {item.label}
          </Link>
        ) : (
          <span className="break-all text-gray-700">{item.label}</span>
        )}
      </span>
    ))}
  </nav>
)

export const PageHeader = ({
  title,
  badge,
  children,
}: {
  title: ReactNode
  badge?: ReactNode
  children?: ReactNode
}) => (
  <div className="space-y-1">
    <div className="flex flex-wrap items-center gap-2">
      <h1 className="m-0 text-xl font-semibold break-all text-gray-900">{title}</h1>
      {badge}
    </div>
    {children}
  </div>
)

/** "Updating every 2 s · last record 3 s ago" while something is going on. */
export const LiveNote = ({
  live,
  intervalS,
  updatedAt,
  now,
}: {
  live: boolean
  intervalS: number
  updatedAt: string | null
  now: Date
}) =>
  live ? (
    <p className="m-0 flex items-center gap-1.5 text-xs text-blue-800">
      <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" aria-hidden="true" />
      Updating every {intervalS} s · last written {formatAgo(updatedAt, now)}
    </p>
  ) : null

export const UnreadableNotice = ({ items }: { items: string[] }) =>
  items.length ? (
    <div
      role="status"
      className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
    >
      <p className="m-0 font-medium">Some records could not be read:</p>
      <ul className="m-0 mt-1 pl-4">
        {items.slice(0, 10).map(item => (
          <li key={item} className="break-all">
            {item}
          </li>
        ))}
      </ul>
    </div>
  ) : null
