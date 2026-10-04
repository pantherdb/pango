import {
  ABSENT,
  countOf,
  formatAgo,
  formatBytes,
  formatCount,
  formatDelta,
  formatDuration,
  formatPercent,
  formatTime,
  humanize,
} from '@/shared/format'

describe('format', () => {
  it('writes absence as a dash, never as zero', () => {
    expect(formatCount(null)).toBe(ABSENT)
    expect(formatCount(undefined)).toBe(ABSENT)
    expect(formatCount(0)).toBe('0')
    expect(formatCount(90961)).toBe('90,961')
    expect(formatBytes(null)).toBe(ABSENT)
    expect(formatDuration(null)).toBe(ABSENT)
    expect(formatTime(null)).toBe(ABSENT)
    expect(formatDelta(null, null)).toBe(ABSENT)
  })

  it('counts with the right noun', () => {
    expect(countOf(1, 'run')).toBe('1 run')
    expect(countOf(1200, 'batch', 'batches')).toBe('1,200 batches')
  })

  it('writes sizes and durations at a readable scale', () => {
    expect(formatBytes(900)).toBe('900 B')
    expect(formatBytes(423570874)).toBe('404 MB')
    expect(formatBytes(13341)).toBe('13.0 KB')
    expect(formatDuration(0.232)).toBe('232 ms')
    expect(formatDuration(8.07)).toBe('8.1 s')
    expect(formatDuration(263.4)).toBe('4 min 23 s')
    expect(formatDuration(7400)).toBe('2 h 3 min')
  })

  it('writes local times (UTC in tests) and how long ago', () => {
    expect(formatTime('2026-10-04T09:02:54.123Z')).toBe('2026-10-04 09:02:54')
    const now = new Date('2026-10-04T14:00:00Z')
    expect(formatAgo('2026-10-04T13:59:55Z', now)).toBe('5 s ago')
    expect(formatAgo('2026-10-04T13:00:00Z', now)).toBe('1 h ago')
    expect(formatAgo('2026-10-01T14:00:00Z', now)).toBe('3 days ago')
  })

  it('signs a change and its share', () => {
    expect(formatDelta(1204, 1.42)).toBe('+1,204 (+1.4 %)')
    expect(formatDelta(-13644, -15)).toBe('−13,644 (−15.0 %)')
    expect(formatDelta(3, null)).toBe('+3')
    expect(formatDelta(0, 0)).toBe('no change')
    expect(formatDelta(1, 0.01)).toBe('+1 (+<0.1 %)')
  })

  it('writes shares and names', () => {
    expect(formatPercent(1, 4)).toBe('25.0 %')
    expect(formatPercent(4, 4)).toBe('100 %')
    expect(formatPercent(1, 0)).toBe(ABSENT)
    expect(humanize('references_non_pmid')).toBe('References non pmid')
  })
})
