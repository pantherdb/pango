import type React from 'react'
import { useMemo, useState, useEffect } from 'react'
import { ActionIcon, Button, Checkbox, Tooltip } from '@mantine/core'
import { FiChevronDown, FiChevronRight, FiLayers, FiX } from 'react-icons/fi'
import type { AspectMapType } from '@/@pango.core/data/config'
import { ASPECT_MAP } from '@/@pango.core/data/config'
import { SearchFilterType } from '@/features/search/search'
import { addItem } from '@/features/search/searchSlice'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import TermFilterForm from '@/features/terms/components/TermFilterForm'
import ChildTermFilterDisplay from '@/features/terms/components/ChildTermFilterDisplay'
import { trackEvent } from '@/analytics'
import { useGetTermStatsQuery } from '@/features/terms/slices/termsApiSlice'
import { setExpandedCategory, clearExpandedCategory } from '@/features/terms/slices/termsSlice'
import type { CategoryTerm, Term } from '@/features/terms/models/term'

const CHILD_TERMS_HELP =
  'Listed below are all GO terms in this category that are annotated to a human gene. The annotated term can be the same, but is usually more specific, than the category term. The numbers below count the genes annotated directly to a given term, whereas the counts above for the category include genes annotated either directly to that term or to one of its more specific descendant terms in GO.'

const CategoryStats: React.FC = () => {
  const dispatch = useAppDispatch()
  const [selectedAspects, setSelectedAspects] = useState<string[]>(
    Object.values(ASPECT_MAP).map(aspect => aspect.id)
  )

  const categories = useAppSelector(state => state.terms.functionCategories)
  const expandedCategoryId = useAppSelector(state => state.terms.expandedCategoryId)
  const childTerms = useAppSelector(state => state.terms.childTerms)

  const search = useAppSelector(state => state.search)

  const filteredCategories = useMemo(
    () => categories.filter(cat => selectedAspects.includes(cat.aspect)),
    [categories, selectedAspects]
  )

  const termStatsFilter = useMemo(() => {
    if (!expandedCategoryId) return null
    return {
      geneIds: search.genes.map(g => g.gene),
      slimTermIds: [...search.slimTerms.map(t => t.id), expandedCategoryId],
      termIds: search.terms.map(t => t.id),
    }
  }, [expandedCategoryId, search.genes, search.slimTerms, search.terms])

  const { data: termStatsData } = useGetTermStatsQuery(
    { filter: termStatsFilter },
    { skip: !termStatsFilter }
  )

  useEffect(() => {
    if (termStatsData && expandedCategoryId) {
      const buckets = (termStatsData.termFrequency?.buckets || []).filter(bucket =>
        bucket.meta.parentIds?.includes(expandedCategoryId)
      )

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

  const handleCategoryExpand = (item: CategoryTerm) => {
    if (expandedCategoryId === item.id) {
      dispatch(clearExpandedCategory())
    } else {
      dispatch(setExpandedCategory({ categoryId: item.id, terms: [] }))
    }
    trackEvent('Search', 'Functionome Category Expanded', `${item.label} (${item.id})`)
  }

  const handleCategoryClick = (term: Term) => {
    dispatch(addItem({ type: SearchFilterType.SLIM_TERMS, item: term }))
    trackEvent('Search', 'Functionome Category Selection', `${term.label} (${term.id})`)
  }

  const handleChildTermClick = (term: Term) => {
    dispatch(addItem({ type: SearchFilterType.TERMS, item: term }))
    trackEvent('Search', 'Child Term Selection', `${term.label} (${term.id})`)
  }

  return (
    <div className="w-full">
      <div className="w-full p-2 pt-6 pb-4">
        <TermFilterForm />
        <ChildTermFilterDisplay />
      </div>

      <div className="border-b border-gray-200 p-2">
        <h3 className="font-medium md:text-lg">Distribution of Genes by Function Category</h3>
      </div>

      <div className="flex w-full items-center gap-2 p-2">
        <div className="text-xs">Show/hide GO aspects in graph</div>

        <div className="flex flex-grow gap-2">
          {Object.values(ASPECT_MAP).map((aspect: AspectMapType) => {
            const isSelected = selectedAspects.includes(aspect.id)
            return (
              <Tooltip key={aspect.id} label={aspect.description} openDelay={1500}>
                <label
                  className="flex h-11 flex-grow cursor-pointer items-center gap-1.5 rounded px-2.5"
                  style={{ backgroundColor: isSelected ? `${aspect.color}50` : '#EEEEEE' }}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleAspect(aspect.id)}
                    size="xs"
                    color={aspect.color}
                    styles={{ input: { borderColor: aspect.color } }}
                    aria-label={aspect.label}
                  />
                  <span>{aspect.shorthand}</span>
                </label>
              </Tooltip>
            )
          })}
        </div>
      </div>
      <div className="mb-6 flex flex-col p-2">
        {filteredCategories.map(item => {
          const isExpanded = expandedCategoryId === item.id
          return (
            <div key={item.id}>
              <div
                className="flex cursor-pointer items-center border-b border-gray-300 py-1 hover:bg-gray-50"
                onClick={e => {
                  e.stopPropagation()
                  handleCategoryClick(item)
                }}
              >
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
                <Tooltip label={item.label} openDelay={1500}>
                  <div className="w-[120px] text-xs">
                    <div className="line-clamp-2">{item.label}</div>
                  </div>
                </Tooltip>
                <ActionIcon
                  size="xs"
                  className="mr-1"
                  aria-label={`${isExpanded ? 'Hide' : 'Show'} terms in ${item.label}`}
                  aria-expanded={isExpanded}
                  onClick={e => {
                    e.stopPropagation()
                    handleCategoryExpand(item)
                  }}
                >
                  {isExpanded ? (
                    <FiChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <FiChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                </ActionIcon>
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
                      variant="outline"
                      size="xs"
                      className="-mt-1.5 h-full w-full bg-primary-50 px-2 text-2xs hover:bg-primary-100"
                    >
                      {item.count} genes
                    </Button>
                  </div>
                </div>
              </div>

              {isExpanded && childTerms.length > 0 && (
                <div
                  className="my-2 ml-4 overflow-hidden rounded-b-lg border border-l-4 border-gray-300 bg-white shadow-md"
                  style={{
                    borderColor: item.color,
                  }}
                >
                  <div
                    className="flex items-center justify-between border-b px-3 py-3"
                    style={{
                      backgroundColor: `${item.color}50`,
                      borderBottomColor: `${item.color}80`,
                    }}
                  >
                    <Tooltip label={CHILD_TERMS_HELP} openDelay={2000}>
                      <div className="flex cursor-help items-center gap-2">
                        <FiLayers className="h-5 w-5" style={{ color: item.color }} />
                        <span className="text-xs font-semibold">
                          Directly annotated terms in this category ({childTerms.length})
                        </span>
                      </div>
                    </Tooltip>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        dispatch(clearExpandedCategory())
                      }}
                      className="flex items-center justify-center rounded-full p-1 transition-colors hover:opacity-80"
                      aria-label="Collapse child terms"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>

                  <div
                    style={{
                      backgroundColor: `${item.color}10`,
                    }}
                  >
                    {childTerms.map(term => (
                      <div
                        key={term.id}
                        className="flex cursor-pointer items-center border-b border-gray-200 py-1 pl-2 transition-colors duration-150 hover:bg-primary-50"
                        onClick={e => {
                          e.stopPropagation()
                          handleChildTermClick(term)
                        }}
                      >
                        <div
                          className="mr-2 flex h-6 w-6 items-center justify-center rounded border text-xs font-bold"
                          style={{
                            border: `1px solid ${term.color}50`,
                            color: term.color,
                            backgroundColor: `${term.color}20`,
                          }}
                        >
                          {term.aspectShorthand}
                        </div>
                        <Tooltip label={term.label} openDelay={1500}>
                          <div className="w-[120px] text-xs text-gray-700">
                            <div className="line-clamp-2">{term.label}</div>
                          </div>
                        </Tooltip>
                        <div className="relative h-6 flex-1">
                          <div
                            className="absolute h-full opacity-60"
                            style={{
                              backgroundColor: term.color,
                              width: term.width,
                            }}
                          />

                          <div
                            className="absolute top-1/2 h-5 w-20 -translate-y-1/2 transform"
                            style={{
                              left: term.countPos,
                            }}
                          >
                            <Button
                              variant="outline"
                              size="xs"
                              className="-mt-1.5 h-full w-full bg-primary-50 px-2 text-2xs hover:bg-primary-100"
                            >
                              {term.count} genes
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
