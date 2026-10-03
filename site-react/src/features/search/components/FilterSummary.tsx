import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { SearchFilterType } from '../search'
import { clearSearch, removeItem } from '../searchSlice'
import { Badge, Pill, Tooltip } from '@mantine/core'

const FilterSummary = () => {
  const dispatch = useAppDispatch()
  const search = useAppSelector(state => state.search)

  const clearAllFilters = () => {
    dispatch(clearSearch())
  }

  const removeFilter = (filterType: SearchFilterType) => {
    const items = search[filterType]
    items.forEach(item => {
      dispatch(
        removeItem({
          type: filterType,
          id: filterType === SearchFilterType.GENES ? item.gene : item.id,
        })
      )
    })
  }

  if (search.filtersCount === 0) {
    return (
      <span className="text-2xs italic text-gray-500 md:text-base">
        No Filters selected: You can filter the list to find a specific function category.
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <small className="mr-2 text-xs md:text-sm">Filtered By:</small>
      <Badge
        onClick={clearAllFilters}
        className="!h-6 !cursor-pointer !bg-accent-200 !text-xs"
        size="sm"
        variant="filled"
      >
        Clear All Filters
      </Badge>
      {search.genes.length > 0 && (
        <Tooltip label={search.tooltips.genes} openDelay={1500} position="bottom" withArrow>
          <Pill
            size="sm"
            withRemoveButton
            onRemove={() => removeFilter(SearchFilterType.GENES)}
            className="!h-6 !text-xs"
          >
            {`Genes (${search.genes.length})`}
          </Pill>
        </Tooltip>
      )}
      {search.slimTerms.length > 0 && (
        <Tooltip label={search.tooltips.slimTerms} openDelay={1500} position="bottom" withArrow>
          <Pill
            size="sm"
            withRemoveButton
            onRemove={() => removeFilter(SearchFilterType.SLIM_TERMS)}
            className="!h-6 !text-xs"
          >
            {`Function Categories (${search.slimTerms.length})`}
          </Pill>
        </Tooltip>
      )}
      {search.terms.length > 0 && (
        <Tooltip label={search.tooltips.terms} openDelay={1500} position="bottom" withArrow>
          <Pill
            size="sm"
            withRemoveButton
            onRemove={() => removeFilter(SearchFilterType.TERMS)}
            className="!h-6 !text-xs"
          >
            {`Terms (${search.terms.length})`}
          </Pill>
        </Tooltip>
      )}
    </div>
  )
}

export default FilterSummary
