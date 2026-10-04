import { describe, expect, it } from 'vitest'
import type { AnnotationStats } from '@/features/annotations/models/annotation'
import annotationsReducer, {
  annotationSlice,
  resetFilterArgs,
  setFilterArgs,
  setStats,
} from '@/features/annotations/slices/annotationsSlice'

describe('annotationsSlice', () => {
  it('merges new filter arguments into the current ones and resets them', () => {
    const initial = annotationSlice.getInitialState()

    const filtered = annotationsReducer(
      annotationsReducer(initial, setFilterArgs({ geneIds: ['UniProtKB:P04637'] })),
      setFilterArgs({ evidenceTypeIds: ['direct'] })
    )
    expect(filtered.filterArgs).toEqual({
      ...initial.filterArgs,
      geneIds: ['UniProtKB:P04637'],
      evidenceTypeIds: ['direct'],
    })

    expect(annotationsReducer(filtered, resetFilterArgs()).filterArgs).toEqual(initial.filterArgs)
  })

  it('keeps the latest annotation statistics', () => {
    const stats = {
      distinctGeneCount: 1,
      termFrequency: { buckets: [] },
      termTypeFrequency: { buckets: [{ key: 'known', docCount: 5, meta: null }] },
      aspectFrequency: { buckets: [] },
      evidenceTypeFrequency: { buckets: [] },
      slimTermFrequency: { buckets: [] },
    } satisfies AnnotationStats

    expect(annotationSlice.getInitialState().stats).toBeNull()
    expect(annotationsReducer(annotationSlice.getInitialState(), setStats(stats)).stats).toEqual(
      stats
    )
  })
})
