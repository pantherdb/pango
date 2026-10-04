import { Tooltip } from '@mantine/core'
import { formatCount, formatPercent } from '@/shared/format'

/**
 * The few charts the dashboard needs, as positioned divs and one small SVG: no chart library
 * (site-react has none either), and they render in jsdom, so tests can read them.
 */

export interface Datum {
  key: string
  value: number
}

/** Labelled horizontal bars, largest first, each with its share of the total. */
export const BarList = ({
  label,
  data,
  limit,
  tone = 'bg-primary-400',
}: {
  label: string
  data: Datum[]
  limit?: number
  tone?: string
}) => {
  const sorted = [...data].sort((a, b) => b.value - a.value || a.key.localeCompare(b.key))
  const shown = limit ? sorted.slice(0, limit) : sorted
  const max = Math.max(1, ...sorted.map(d => d.value))
  const total = sorted.reduce((sum, d) => sum + d.value, 0)
  return (
    <figure aria-label={label} className="m-0 space-y-1">
      {shown.map(d => (
        <div
          key={d.key}
          className="grid grid-cols-[minmax(6rem,12rem)_1fr_auto] items-center gap-2 text-xs"
        >
          <span className="truncate text-gray-700" title={d.key}>
            {d.key}
          </span>
          <span className="h-2.5 rounded-sm bg-gray-100">
            <span
              className={`block h-full rounded-sm ${tone}`}
              style={{ width: `${(100 * d.value) / max}%` }}
            />
          </span>
          <span className="figures text-right whitespace-nowrap text-gray-600">
            {formatCount(d.value)}{' '}
            <span className="text-gray-400">{formatPercent(d.value, total)}</span>
          </span>
        </div>
      ))}
      {limit && sorted.length > limit && (
        <figcaption className="text-xs text-gray-500">
          and {formatCount(sorted.length - limit)} more
        </figcaption>
      )}
    </figure>
  )
}

const SPLIT_TONES = [
  'bg-primary-500',
  'bg-accent-500',
  'bg-teal-500',
  'bg-rose-400',
  'bg-gray-400',
  'bg-violet-400',
]

/** One bar split into parts, with a legend: shares of a whole, such as the three GO aspects. */
export const SplitBar = ({ label, data }: { label: string; data: Datum[] }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (!total) return null
  const parts = [...data].sort((a, b) => b.value - a.value)
  return (
    <figure aria-label={label} className="m-0">
      <div className="flex h-3 overflow-hidden rounded-sm">
        {parts.map((d, i) => (
          <Tooltip
            key={d.key}
            label={`${d.key}: ${formatCount(d.value)} (${formatPercent(d.value, total)})`}
          >
            <span
              className={SPLIT_TONES[i % SPLIT_TONES.length]}
              style={{ width: `${(100 * d.value) / total}%` }}
            />
          </Tooltip>
        ))}
      </div>
      <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-gray-600">
        {parts.map((d, i) => (
          <li key={d.key} className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-sm ${SPLIT_TONES[i % SPLIT_TONES.length]}`}
              aria-hidden="true"
            />
            {d.key} <span className="figures text-gray-500">{formatPercent(d.value, total)}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

/** Vertical bars in their given order: a distribution over ordered buckets. */
export const Histogram = ({
  label,
  data,
  unit,
}: {
  label: string
  data: Datum[]
  unit: string
}) => {
  const max = Math.max(1, ...data.map(d => d.value))
  return (
    <figure aria-label={label} className="m-0">
      <div className="flex h-28 items-end gap-1">
        {data.map(d => (
          <Tooltip key={d.key} label={`${d.key}: ${formatCount(d.value)} ${unit}`}>
            <div className="flex h-full min-w-0 flex-1 flex-col justify-end">
              <span className="figures text-center text-2xs text-gray-500">
                {d.value ? formatCount(d.value) : ''}
              </span>
              <span
                className="block rounded-t-sm bg-primary-400"
                style={{ height: `${Math.max(d.value ? 2 : 0, (100 * d.value) / max)}%` }}
              />
            </div>
          </Tooltip>
        ))}
      </div>
      <div className="mt-1 flex gap-1 border-t border-gray-200 pt-1">
        {data.map(d => (
          <span key={d.key} className="min-w-0 flex-1 truncate text-center text-2xs text-gray-500">
            {d.key}
          </span>
        ))}
      </div>
    </figure>
  )
}

/** A figure across builds, oldest to newest, the last point marked. */
export const Sparkline = ({ label, values }: { label: string; values: number[] }) => {
  if (values.length < 2) return null
  const width = 96
  const height = 24
  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  const points = values.map((v, i) => [
    (i * width) / (values.length - 1),
    height - 2 - ((v - min) * (height - 4)) / span,
  ])
  const last = points[points.length - 1]
  return (
    <svg
      role="img"
      aria-label={label}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <polyline
        points={points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-primary-400"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" className="fill-primary-600" />
    </svg>
  )
}
