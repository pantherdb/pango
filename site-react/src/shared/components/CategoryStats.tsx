import type React from 'react'
import { useMemo, useState } from 'react'
import type { AspectMapType } from '@/@pango.core/data/config'
import { ASPECT_MAP } from '@/@pango.core/data/config'
import { SearchFilterType } from '@/features/search/search'
import { addItem } from '@/features/search/searchSlice'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import TermFilterForm from '@/features/terms/components/TermFilterForm'
import { trackEvent } from '@/analytics'
import Tooltip from '@mui/material/Tooltip'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'

const CategoryStats: React.FC = () => {
  const dispatch = useAppDispatch()
  const [selectedAspects, setSelectedAspects] = useState<string[]>(
    Object.values(ASPECT_MAP).map(aspect => aspect.id)
  )

  const categories = useAppSelector(state => state.terms.functionCategories)
  const filteredCategories = useMemo(
    () => categories.filter(cat => selectedAspects.includes(cat.aspect)),
    [categories, selectedAspects]
  )

  const toggleAspect = (aspectId: string) => {
    setSelectedAspects(prev =>
      prev.includes(aspectId) ? prev.filter(id => id !== aspectId) : [...prev, aspectId]
    )
  }

  const handleCategoryClick = (item: any) => {
    dispatch(addItem({ type: SearchFilterType.SLIM_TERMS, item }))
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
        {filteredCategories.map(item => (
          <div
            key={item.id}
            className="flex cursor-pointer items-center border-b border-gray-300 py-1 hover:bg-gray-50"
            onClick={() => handleCategoryClick(item)}
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
        ))}
      </div>
    </div>
  )
}

export default CategoryStats
