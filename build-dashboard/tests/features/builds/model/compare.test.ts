import {
  LARGE_CHANGE_PCT,
  compareBreakdown,
  compareFigure,
  compareFigures,
} from '@/features/builds/model/compare'

describe('compareFigure', () => {
  it('measures a change against the previous figure', () => {
    expect(compareFigure('a', 'A', 115, 100)).toMatchObject({
      delta: 15,
      pct: 15,
      change: 'up',
      large: true,
    })
    expect(compareFigure('a', 'A', 95, 100)).toMatchObject({
      delta: -5,
      pct: -5,
      change: 'down',
      large: false,
    })
    expect(compareFigure('a', 'A', 100, 100)).toMatchObject({
      delta: 0,
      change: 'same',
      large: false,
    })
  })

  it(`calls a change of ${LARGE_CHANGE_PCT} % or more large, either way`, () => {
    expect(compareFigure('a', 'A', 90, 100).large).toBe(true)
    expect(compareFigure('a', 'A', 91, 100).large).toBe(false)
  })

  it('has no percentage from zero, and any change from zero is large', () => {
    expect(compareFigure('a', 'A', 3, 0)).toMatchObject({ delta: 3, pct: null, large: true })
    expect(compareFigure('a', 'A', 0, 0)).toMatchObject({ pct: null, large: false })
  })

  it('tells new and vanished figures from changes', () => {
    expect(compareFigure('a', 'A', 5, null)).toMatchObject({ change: 'new', large: false })
    expect(compareFigure('a', 'A', null, 5)).toMatchObject({ change: 'gone', large: true })
    expect(compareFigure('a', 'A', null, null).change).toBe('absent')
  })
})

describe('compareFigures', () => {
  it('lists the key figures either build has, in reading order', () => {
    const rows = compareFigures({ annotations: 10, genes: 5 }, { annotations: 8 })
    expect(rows.map(row => [row.key, row.change])).toEqual([
      ['annotations', 'up'],
      ['genes', 'new'],
    ])
  })

  it('has nothing to compare without a previous build', () => {
    expect(compareFigures({ annotations: 10 }, null)[0]).toMatchObject({
      previous: null,
      change: 'new',
    })
  })
})

describe('compareBreakdown', () => {
  it('lists every key of both, largest now first', () => {
    expect(compareBreakdown({ a: 1, b: 5 }, { a: 2, c: 7 })).toEqual([
      { key: 'b', previous: null, current: 5, delta: null },
      { key: 'a', previous: 2, current: 1, delta: -1 },
      { key: 'c', previous: 7, current: null, delta: null },
    ])
  })
})
