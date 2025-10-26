import type React from 'react'
import { useMemo, useState, useEffect } from 'react'
import type { AspectMapType } from '@/@pango.core/data/config'
import { ASPECT_MAP } from '@/@pango.core/data/config'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import TermFilterForm from '@/features/terms/components/TermFilterForm'
import { trackEvent } from '@/analytics'
import Tooltip from '@mui/material/Tooltip'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import { useGetTermStatsQuery } from '@/features/terms/slices/termsApiSlice'
import { setExpandedCategory, clearExpandedCategory } from '@/features/terms/slices/termsSlice'
import type { Term } from '@/features/terms/models/term'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import type { RootState } from '@/app/store/store'

const CategoryStats: React.FC = () => {
  const dispatch = useAppDispatch()
  const [selectedAspects, setSelectedAspects] = useState<string[]>(
    Object.values(ASPECT_MAP).map(aspect => aspect.id)
  )

  const categories = useAppSelector(state => state.terms.functionCategories)
  const expandedCategoryId = useAppSelector(state => state.terms.expandedCategoryId)
  const childTerms = useAppSelector(state => state.terms.childTerms)

  const search = useAppSelector((state: RootState) => state.search)

  const filteredCategories = useMemo(
    () => categories.filter(cat => selectedAspects.includes(cat.aspect)),
    [categories, selectedAspects]
  )

  // Build filter for term_stats query - only when a category is expanded
  const termStatsFilter = useMemo(() => {
    if (!expandedCategoryId) return null
    return {
      geneIds: search.genes.map(g => g.gene),
      slimTermIds: [expandedCategoryId], // Only the expanded category
    }
  }, [expandedCategoryId, search.genes])

  // Fetch term stats when a category is expanded
  const { data: termStatsData } = useGetTermStatsQuery(
    { filter: termStatsFilter },
    { skip: !termStatsFilter }
  )

  // Update child terms when term stats data arrives
  useEffect(() => {
    if (termStatsData && expandedCategoryId) {
      const buckets = termStatsData.termFrequency?.buckets || []

      // Find the highest count for ratio calculation
      const longest = buckets.reduce((max, bucket) => Math.max(max, bucket.docCount), 0)

      const terms: Term[] = buckets.map(bucket => {
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
          id: bucket.meta.id,
          label: bucket.meta.label,
          displayId: bucket.meta.displayId,
          aspect: bucket.meta.aspect,
          isGoSlim: false,
          evidenceType: '',
          count: bucket.docCount,
          color: ASPECT_MAP[bucket.meta.aspect]?.color,
          aspectShorthand: ASPECT_MAP[bucket.meta.aspect]?.shorthand,
          width,
          countPos,
        }
      })

      dispatch(setExpandedCategory({ categoryId: expandedCategoryId, terms }))
    }
  }, [termStatsData, expandedCategoryId, dispatch])

  const toggleAspect = (aspectId: string) => {
    setSelectedAspects(prev =>
      prev.includes(aspectId) ? prev.filter(id => id !== aspectId) : [...prev, aspectId]
    )
  }

  const handleCategoryClick = (item: any) => {
    // If clicking the same category, collapse it
    if (expandedCategoryId === item.id) {
      dispatch(clearExpandedCategory())
    } else {
      // Expand the new category (will fetch term stats via useEffect)
      dispatch(setExpandedCategory({ categoryId: item.id, terms: [] }))
    }
    trackEvent('Search', 'Functionome Category Selection', item.label, item.id)
  }

  return (
    <div className="w-full">
      <div className="w-full p-2 pb-4 pt-6">
        <TermFilterForm />
      </div>

      <div className="border-b border-gray-200 p-2">
        <h3 className="font-medium md:text-lg">Distribution of Genes by Function Category</h3>
      </div>

      <div className="flex w-full items-center gap-2 p-2">
        <div className="text-xs">Show/hide GO aspects in graph</div>

        <div className="flex flex-grow gap-2">
          {Object.values(ASPECT_MAP).map((aspect: AspectMapType) => (
            <Tooltip
              key={aspect.id}
              title={aspect.description}
              placement="top"
              enterDelay={1500}
              arrow
              className="flex-grow"
            >
              <div
                className="flex h-11 cursor-pointer items-center rounded"
                style={{
                  backgroundColor: selectedAspects.includes(aspect.id)
                    ? `${aspect.color}50`
                    : '#EEEEEE',
                }}
                onClick={() => toggleAspect(aspect.id)}
              >
                <Checkbox
                  checked={selectedAspects.includes(aspect.id)}
                  onChange={() => toggleAspect(aspect.id)}
                  onClick={e => e.stopPropagation()}
                  size="small"
                  sx={{
                    color: `${aspect.color}50`,
                    '&.Mui-checked': {
                      color: aspect.color,
                    },
                  }}
                />
                <span className="-ml-1">{aspect.shorthand}</span>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
      <div className="mb-6 flex flex-col p-2">
        {filteredCategories.map(item => {
          const isExpanded = expandedCategoryId === item.id
          return (
            <div key={item.id}>
              <div
                className="flex cursor-pointer items-center border-b border-gray-300 py-1 hover:bg-gray-50"
                onClick={() => handleCategoryClick(item)}
              >
                <div className="mr-1 flex items-center">
                  {isExpanded ? (
                    <FiChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <FiChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div
                  className="mr-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    border: `1px solid ${item.color}50`,
                    color: item.color,
                    backgroundColor: `${item.color}20`,
                  }}
                >
                  {item.aspectShorthand}
                </div>
                <Tooltip title={item.label} placement="top" enterDelay={1500} arrow>
                  <div className="w-[120px] text-xs">
                    <div className="line-clamp-2">{item.label}</div>
                  </div>
                </Tooltip>
                <div className="relative h-7 flex-1">
                  <div
                    className="absolute h-full"
                    style={{
                      backgroundColor: item.color,
                      width: item.width,
                    }}
                  />

                  <div
                    className="absolute top-1/2 h-5 w-20 -translate-y-1/2 transform"
                    style={{
                      left: item.countPos,
                    }}
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      className="!-mt-1.5 !h-full w-full rounded-md !bg-primary-50 !text-2xs hover:!bg-primary-100"
                    >
                      {item.count} genes
                    </Button>
                  </div>
                </div>
              </div>

              {/* Render child terms when expanded */}
              {isExpanded && childTerms.length > 0 && (
                <div className="ml-12 border-l-4 border-gray-300 bg-gradient-to-r from-gray-100 to-gray-50 pl-4">
                  {childTerms.map(term => (
                    <div
                      key={term.id}
                      className="flex items-center border-b border-gray-200 py-1 opacity-75"
                    >
                      <div
                        className="mr-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold opacity-70"
                        style={{
                          border: `1px solid ${term.color}40`,
                          color: term.color,
                          backgroundColor: `${term.color}15`,
                        }}
                      >
                        {term.aspectShorthand}
                      </div>
                      <Tooltip title={term.label} placement="top" enterDelay={1500} arrow>
                        <div className="w-[120px] text-xs text-gray-600">
                          <div className="line-clamp-2">{term.label}</div>
                        </div>
                      </Tooltip>
                      <div className="relative h-5 flex-1">
                        <div
                          className="absolute h-full opacity-50"
                          style={{
                            backgroundColor: term.color,
                            width: term.width,
                          }}
                        />

                        <div
                          className="absolute top-1/2 h-4 w-20 -translate-y-1/2 transform"
                          style={{
                            left: term.countPos,
                          }}
                        >
                          <Button
                            variant="outlined"
                            size="small"
                            disabled
                            className="!-mt-1 !h-full w-full rounded-md !bg-gray-100 !text-2xs !opacity-60"
                          >
                            {term.count} genes
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryStats
