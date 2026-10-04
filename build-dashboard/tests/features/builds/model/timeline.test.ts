import { MIN_WIDTH, layoutTimeline } from '@/features/builds/model/timeline'

const NOW = new Date('2026-10-04T14:00:00Z')

describe('layoutTimeline', () => {
  it('places spans as fractions of one axis', () => {
    const timeline = layoutTimeline(
      [
        { id: 'a', startedAt: '2026-10-04T13:00:00.000Z', finishedAt: '2026-10-04T13:30:00.000Z' },
        { id: 'b', startedAt: '2026-10-04T13:30:00.000Z', finishedAt: '2026-10-04T14:00:00.000Z' },
      ],
      NOW
    )!
    expect(timeline.bars).toEqual([
      { id: 'a', left: 0, width: 0.5 },
      { id: 'b', left: 0.5, width: 0.5 },
    ])
    expect(timeline.totalS).toBe(3600)
    expect(timeline.ticks).toEqual([0, 900, 1800, 2700, 3600])
  })

  it('runs a span still going on up to now', () => {
    const timeline = layoutTimeline(
      [{ id: 'a', startedAt: '2026-10-04T13:59:00.000Z', finishedAt: null }],
      NOW
    )!
    expect(timeline.totalS).toBe(60)
    expect(timeline.bars[0].width).toBe(1)
  })

  it('keeps a very short span visible', () => {
    const timeline = layoutTimeline(
      [
        {
          id: 'long',
          startedAt: '2026-10-04T13:00:00.000Z',
          finishedAt: '2026-10-04T14:00:00.000Z',
        },
        {
          id: 'blip',
          startedAt: '2026-10-04T13:00:00.000Z',
          finishedAt: '2026-10-04T13:00:00.010Z',
        },
      ],
      NOW
    )!
    expect(timeline.bars[1].width).toBe(MIN_WIDTH)
  })

  it('has nothing to lay out without times', () => {
    expect(layoutTimeline([{ id: 'a', startedAt: null, finishedAt: null }], NOW)).toBeNull()
    expect(layoutTimeline([], NOW)).toBeNull()
  })
})
