import type React from 'react'
import { useAppDispatch, useAppSelector } from '../hooks'
import { setLeftDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice'
import { clearSearch } from '@/features/search/searchSlice'
import CategoryStats from '@/shared/components/CategoryStats'
import { Button, Tooltip } from '@mantine/core'
import { useIsMobile } from '@/shared/hooks/useIsMobile'

const LeftDrawerContent: React.FC = () => {
  const dispatch = useAppDispatch()
  const search = useAppSelector(state => state.search)
  const isMobile = useIsMobile()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-gray-200 p-3 pr-1">
        <span className="text-xs font-bold md:text-sm">Interactive Graph and Filter</span>
        <div className="ml-auto flex gap-1">
          {search.filtersCount > 0 && (
            <Button
              variant="outline"
              size="xs"
              className="bg-accent-200 px-2 hover:bg-accent-300"
              onClick={() => dispatch(clearSearch())}
            >
              Clear Filters
            </Button>
          )}
          <Tooltip
            label="Expand your viewing space by hiding the filter panel and focus on the results. To bring back the panel, simply click the menu icon [hamburger icon] located at the top left corner."
            openDelay={2000}
          >
            <Button
              variant="outline"
              size="xs"
              className="px-2"
              onClick={() => dispatch(setLeftDrawerOpen(false))}
            >
              {isMobile ? 'View Results' : 'Close'}
            </Button>
          </Tooltip>
        </div>
      </div>
      <CategoryStats />
    </div>
  )
}

export default LeftDrawerContent
