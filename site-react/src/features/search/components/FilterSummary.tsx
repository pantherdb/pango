import { Button, Tooltip } from '@mantine/core'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { FilterPill } from '@/shared/components/FilterPill'
import { SearchFilterType } from '../search'
import { clearSearch, removeItem } from '../searchSlice'

const FILTER_GROUPS = [
  { type: SearchFilterType.GENES, label: 'Genes' },
  { type: SearchFilterType.SLIM_TERMS, label: 'Function Categories' },
  { type: SearchFilterType.TERMS, label: 'Terms' },
]

const FilterSummary = () => {
  const dispatch = useAppDispatch()
  const search = useAppSelector(state => state.search)

  const removeFilterGroup = (type: SearchFilterType) => {
    const ids =
      type === SearchFilterType.GENES
        ? search.genes.map(gene => gene.gene)
        : search[type].map(term => term.id)
    ids.forEach(id => dispatch(removeItem({ type, id })))
  }

  if (search.filtersCount === 0) {
    return (
      <span className="text-2xs text-gray-500 italic md:text-base">
        No Filters selected: You can filter the list to find a specific function category.
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <small className="mr-2 text-xs md:text-sm">Filtered By:</small>
      <Button
        size="compact-xs"
        color="accent.2"
        autoContrast
        onClick={() => dispatch(clearSearch())}
      >
        Clear All Filters
      </Button>
      {FILTER_GROUPS.map(({ type, label }) => {
        const count = search[type].length
        if (count === 0) return null
        return (
          <Tooltip
            key={type}
            label={search.tooltips[type]}
            openDelay={1500}
            position="bottom"
            // Each selected filter is on its own line.
            classNames={{ tooltip: 'whitespace-pre-line' }}
          >
            <FilterPill
              className="h-6"
              onRemove={() => removeFilterGroup(type)}
              removeLabel={`Remove ${label.toLowerCase()} filters`}
            >
              {`${label} (${count})`}
            </FilterPill>
          </Tooltip>
        )
      })}
    </div>
  )
}

export default FilterSummary
