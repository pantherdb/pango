import { ASPECT_MAP } from '@/@pango.core/data/config'
import type { Bucket } from '@/features/genes/models/gene'
import type { CategoryTerm } from '../models/term'

export const transformCategoryTerms = (buckets: Bucket[]): CategoryTerm[] => {
  if (!buckets?.length) return []

  const sortedBuckets = [...buckets].sort((a, b) => b.docCount - a.docCount)
  const longest = sortedBuckets[0]?.docCount || 0

  return sortedBuckets.map(bucket => {
    const ratio = bucket.docCount / longest
    const countPos =
      ratio < 0.2
        ? `${ratio * 100}%`
        : ratio < 0.9
          ? `${(ratio - 0.15) * 100}%`
          : `${(ratio - 0.33) * 100}%`

    return {
      ...bucket.meta,
      name: bucket.key,
      count: bucket.docCount,
      color: ASPECT_MAP[bucket.meta.aspect]?.color,
      aspectShorthand: ASPECT_MAP[bucket.meta.aspect]?.shorthand,
      width: `${ratio * 100}%`,
      countPos,
    }
  })
}
