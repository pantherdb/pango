import { Tooltip } from '@mantine/core'
import type { ReactNode } from 'react'
import { layoutTimeline } from '@/features/builds/model/timeline'
import type { Span } from '@/features/builds/model/timeline'
import { formatDuration } from '@/shared/format'
import { statusStyle } from '@/shared/status'

export interface TimelineRow {
  id: string
  label: ReactNode
  segments: (Span & { status: string; tip: string })[]
}

/**
 * Bars on one shared time axis: the runs of a build, one row per dataset, or the phases of a run.
 * Plain divs positioned by percentage, so it needs no chart library and renders in tests.
 */
export const TimelineChart = ({
  rows,
  now,
  label,
}: {
  rows: TimelineRow[]
  now: Date
  label: string
}) => {
  const timeline = layoutTimeline(
    rows.flatMap(row =>
      row.segments.map(segment => ({ ...segment, id: `${row.id}::${segment.id}` }))
    ),
    now
  )
  if (!timeline) return <p className="m-0 text-sm text-gray-500">No timings recorded.</p>
  const bars = new Map(timeline.bars.map(bar => [bar.id, bar]))

  return (
    <figure aria-label={label} className="m-0">
      <div className="grid grid-cols-[minmax(6rem,12rem)_1fr] gap-x-3">
        <div />
        <div className="relative mb-1 h-4 text-2xs text-gray-500">
          {timeline.ticks.map((tick, i) => (
            <span
              key={i}
              className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
              style={{ left: `${i * 25}%` }}
            >
              {formatDuration(tick)}
            </span>
          ))}
        </div>
        {rows.map(row => (
          <div key={row.id} className="contents">
            <div
              className="truncate py-0.5 text-xs text-gray-700"
              title={typeof row.label === 'string' ? row.label : undefined}
            >
              {row.label}
            </div>
            <div className="relative h-5 rounded bg-gray-50">
              {row.segments.map(segment => {
                const bar = bars.get(`${row.id}::${segment.id}`)
                if (!bar) return null
                return (
                  <Tooltip key={segment.id} label={segment.tip} openDelay={100}>
                    <div
                      data-status={segment.status}
                      className={`absolute top-1 bottom-1 rounded-sm ${statusStyle(segment.status).bar}`}
                      style={{ left: `${bar.left * 100}%`, width: `${bar.width * 100}%` }}
                    />
                  </Tooltip>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </figure>
  )
}
