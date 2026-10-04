import { describe, expect, it } from 'vitest'
import { ASPECT_MAP, AspectType } from '@/@pango.core/data/config'
import type { Bucket } from '@/features/genes/models/gene'
import { transformCategoryTerms } from '@/features/terms/services/termsService'

const bucket = (id: string, docCount: number, aspect: string = AspectType.MOLECULAR_FUNCTION) => ({
  key: `${id} label`,
  docCount,
  meta: { id, label: `${id} label`, aspect, displayId: id },
})

const percent = (value: string) => parseFloat(value)

describe('transformCategoryTerms', () => {
  it('returns no categories for no buckets', () => {
    expect(transformCategoryTerms([] as Bucket[])).toEqual([])
  })

  it('lists known categories by gene count first, then the unknown ones', () => {
    const terms = transformCategoryTerms([
      bucket('UNKNOWN:0001', 8000),
      bucket('GO:0005215', 1000),
      bucket('GO:0003824', 4000),
      bucket('UNKNOWN:0002', 9000, AspectType.BIOLOGICAL_PROCESS),
    ])

    expect(terms.map(term => term.id)).toEqual([
      'GO:0003824',
      'GO:0005215',
      'UNKNOWN:0002',
      'UNKNOWN:0001',
    ])
  })

  it('sizes each bar against the largest count and keeps its count label inside the bar', () => {
    const [half, tenth, largest] = transformCategoryTerms([
      bucket('GO:A', 500),
      bucket('GO:B', 100),
      bucket('UNKNOWN:0001', 1000),
    ])

    expect(percent(largest.width)).toBeCloseTo(100)
    expect(percent(half.width)).toBeCloseTo(50)
    expect(percent(tenth.width)).toBeCloseTo(10)
    // Short bars put the label at their end; longer ones pull it back so it stays on the bar.
    expect(percent(tenth.countPos)).toBeCloseTo(10)
    expect(percent(half.countPos)).toBeCloseTo(30)
    expect(percent(largest.countPos)).toBeCloseTo(60)
  })

  it("carries the category's details with its aspect colour and shorthand", () => {
    const [term] = transformCategoryTerms([
      bucket('GO:0023052', 300, AspectType.BIOLOGICAL_PROCESS),
    ])

    expect(term).toMatchObject({
      id: 'GO:0023052',
      label: 'GO:0023052 label',
      displayId: 'GO:0023052',
      aspect: AspectType.BIOLOGICAL_PROCESS,
      count: 300,
      color: ASPECT_MAP[AspectType.BIOLOGICAL_PROCESS].color,
      aspectShorthand: 'BP',
    })
  })
})
