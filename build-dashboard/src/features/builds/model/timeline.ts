/**
 * Spans of time laid out on one axis, as fractions of it: the runs of a build, the phases of a run.
 *
 * Relative imports only (see parse.ts).
 */

export interface Span {
  id: string
  startedAt: string | null
  /** Null while it is still going: it ends at `now`. */
  finishedAt: string | null
}

export interface Bar {
  id: string
  /** 0–1 along the axis. */
  left: number
  width: number
}

export interface Timeline {
  bars: Bar[]
  totalS: number
  /** Seconds from the start for the axis labels: 0, ¼, ½, ¾ and the whole. */
  ticks: number[]
}

/** The narrowest a bar is drawn, as a fraction, so a 50 ms phase is still visible. */
export const MIN_WIDTH = 0.004

export function layoutTimeline(spans: Span[], now: Date): Timeline | null {
  const times = spans
    .map(span => {
      const start = span.startedAt ? Date.parse(span.startedAt) : NaN
      const end = span.finishedAt ? Date.parse(span.finishedAt) : now.getTime()
      return { id: span.id, start, end: Math.max(start, end) }
    })
    .filter(time => !Number.isNaN(time.start) && !Number.isNaN(time.end))
  if (!times.length) return null
  const origin = Math.min(...times.map(time => time.start))
  const total = Math.max(...times.map(time => time.end)) - origin
  const scale = total > 0 ? total : 1
  return {
    bars: times.map(time => {
      const left = (time.start - origin) / scale
      return {
        id: time.id,
        left,
        width: Math.max(MIN_WIDTH, Math.min(1 - left, (time.end - time.start) / scale)),
      }
    }),
    totalS: total / 1000,
    ticks: [0, 0.25, 0.5, 0.75, 1].map(fraction => (fraction * total) / 1000),
  }
}
