import type React from 'react'
import { Tooltip } from '@mantine/core'
import { SearchFilterType } from '@/features/search/search'
import { removeItem } from '@/features/search/searchSlice'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { FilterPill } from '@/shared/components/FilterPill'
import type { Term } from '../models/term'

const PILL_LABEL_LENGTH = 20

const ChildTermFilterDisplay: React.FC = () => {
  const dispatch = useAppDispatch()
  const selectedTerms = useAppSelector(state => state.search.terms)

  const handleDelete = (termToDelete: Term) => {
    dispatch(removeItem({ type: SearchFilterType.TERMS, id: termToDelete.id }))
  }

  if (selectedTerms.length === 0) return null

  return (
    <div className="w-full p-2">
      <div className="flex flex-wrap gap-2">
        {selectedTerms.map(option => {
          const truncatedLabel =
            option.label.length > PILL_LABEL_LENGTH
              ? `${option.label.substring(0, PILL_LABEL_LENGTH)}...`
              : option.label
          return (
            <Tooltip key={option.id} label={option.label} openDelay={2000}>
              <FilterPill
                className="h-6"
                onRemove={() => handleDelete(option)}
                removeLabel={`Remove ${option.label}`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold"
                    style={{
                      borderColor: option.color,
                      color: option.color,
                      backgroundColor: `${option.color}20`,
                    }}
                  >
                    {option.aspectShorthand}
                  </span>
                  <span className="text-xs text-gray-600">{truncatedLabel}</span>
                </span>
              </FilterPill>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}

export default ChildTermFilterDisplay
