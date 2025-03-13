import { ASPECT_MAP } from '@/@pango.core/data/config'
import type { Bucket } from '@/features/genes/models/gene'
import type { CategoryTerm } from '../models/term'

export const transformCategoryTerms = (buckets: Bucket[]): CategoryTerm[] => {
  if (!buckets?.length) return []

  // Separate known and unknown buckets
  const knownBuckets = buckets.filter(bucket => !bucket.meta?.id.startsWith('UNKNOWN:'))
  const unknownBuckets = buckets.filter(bucket => bucket.meta?.id.startsWith('UNKNOWN:'))

  const sortedKnownBuckets = [...knownBuckets].sort((a, b) => b.docCount - a.docCount)
  const sortedUnknownBuckets = [...unknownBuckets].sort((a, b) => b.docCount - a.docCount)

  // Find the highest count from all buckets for ratio calculation
  const longest = buckets.reduce((max, bucket) => Math.max(max, bucket.docCount), 0)

  const transformBucket = (bucket: Bucket): CategoryTerm => {
    const ratio = bucket.docCount / longest
    let countPos: string

    if (ratio < 0.2) {
      countPos = `${ratio * 100}%`
    } else if (ratio < 0.9) {
      countPos = `${(ratio - 0.2) * 100}%`
    } else {
      countPos = `${(ratio - 0.4) * 100}%`
    }

    const width = `${ratio * 100}%`

    return {
      ...bucket.meta,
      name: bucket.key,
      count: bucket.docCount,
      color: ASPECT_MAP[bucket.meta.aspect]?.color,
      aspectShorthand: ASPECT_MAP[bucket.meta.aspect]?.shorthand,
      width,
      countPos,
    }
  }

  return [
    ...sortedKnownBuckets.map(transformBucket),
    ...sortedUnknownBuckets.map(transformBucket)
  ]
}
