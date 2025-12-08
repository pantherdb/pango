import type React from 'react'
import { IoClose } from 'react-icons/io5'
import { SearchFilterType } from '@/features/search/search'
import { removeItem } from '@/features/search/searchSlice'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import type { RootState } from '@/app/store/store'
import type { Term } from '../models/term'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'

const ChildTermFilterDisplay: React.FC = () => {
  const dispatch = useAppDispatch()
  const selectedTerms = useAppSelector((state: RootState) => state.search.terms)

  const handleDelete = (termToDelete: Term) => {
    dispatch(
      removeItem({
        type: SearchFilterType.TERMS,
        id: termToDelete.id,
      })
    )
  }

  if (selectedTerms.length === 0) return null

  return (
    <div className="w-full p-2">
      <div className="flex flex-wrap gap-2">
        {selectedTerms.map(option => {
          const truncatedLabel = option.label.length > 20
            ? `${option.label.substring(0, 20)}...`
            : option.label
          return (
            <Chip
              key={option.id}
              label={
                <Tooltip title={option.label} placement="top" enterDelay={2000}>
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
                </Tooltip>
              }
              onDelete={() => handleDelete(option)}
              deleteIcon={<IoClose size={16} />}
              size="small"
              className="h-7"
            />
          )
        })}
      </div>
    </div>
  )
}

export default ChildTermFilterDisplay
