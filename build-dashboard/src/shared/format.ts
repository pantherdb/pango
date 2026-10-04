/**
 * How figures, sizes, times and durations are written everywhere in the dashboard.
 *
 * Absence is a dash, never 0: a count nobody took is not a count of zero. Times are shown in the
 * reader's local zone; tests pin TZ=UTC.
 */

export const ABSENT = '—'

const counts = new Intl.NumberFormat('en-US')

export const formatCount = (value: number | null | undefined): string =>
  value === null || value === undefined || Number.isNaN(value) ? ABSENT : counts.format(value)

export const plural = (n: number, one: string, many: string = `${one}s`): string =>
  n === 1 ? one : many

/** `3 runs`, `1 run`, `12,000 annotations`. */
export const countOf = (n: number, one: string, many?: string): string =>
  `${formatCount(n)} ${plural(n, one, many)}`

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return ABSENT
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value >= 100 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return ABSENT
  if (seconds < 1) return `${Math.round(seconds * 1000)} ms`
  if (seconds < 60) return `${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ${Math.round(seconds - minutes * 60)} s`
  const hours = Math.floor(minutes / 60)
  return `${hours} h ${minutes - hours * 60} min`
}

const parse = (iso: string | null | undefined): Date | null => {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

const pad = (n: number) => String(n).padStart(2, '0')

/** `2026-10-04 15:30:00`, local time. */
export function formatTime(iso: string | null | undefined): string {
  const date = parse(iso)
  if (!date) return ABSENT
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

export function formatDate(iso: string | null | undefined): string {
  const date = parse(iso)
  if (!date) return ABSENT
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** `5 s ago`, `3 min ago`, `2 days ago`. */
export function formatAgo(iso: string | null | undefined, now: Date): string {
  const date = parse(iso)
  if (!date) return ABSENT
  const seconds = Math.max(0, (now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return `${Math.round(seconds)} s ago`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`
  if (seconds < 86_400) return `${Math.round(seconds / 3600)} h ago`
  return `${countOf(Math.round(seconds / 86_400), 'day')} ago`
}

/** `+1,204 (+1.4 %)`; `no change`; or a dash when there is nothing to compare with. */
export function formatDelta(delta: number | null, pct: number | null): string {
  if (delta === null) return ABSENT
  if (delta === 0) return 'no change'
  const sign = delta > 0 ? '+' : '−'
  const share =
    pct === null ? '' : ` (${sign}${Math.abs(pct) < 0.1 ? '<0.1' : Math.abs(pct).toFixed(1)} %)`
  return `${sign}${formatCount(Math.abs(delta))}${share}`
}

export const formatPercent = (part: number, whole: number): string =>
  whole > 0 ? `${((100 * part) / whole).toFixed(part === whole || part === 0 ? 0 : 1)} %` : ABSENT

/** `snake_case_name` → `Snake case name`. */
export const humanize = (name: string): string => {
  const words = name.replace(/[_-]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export const shortHash = (sha: string | null | undefined): string =>
  sha ? sha.slice(0, 12) : ABSENT
