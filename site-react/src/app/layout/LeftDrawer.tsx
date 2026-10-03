import type React from 'react'
import { useAppDispatch, useAppSelector } from '../hooks'
import { setLeftDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice'
import { clearSearch } from '@/features/search/searchSlice'
import CategoryStats from '@/shared/components/CategoryStats'
import { Button, Tooltip } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

const LeftDrawerContent: React.FC = () => {
  const dispatch = useAppDispatch()
  const search = useAppSelector(state => state.search)
  const isMobile = useMediaQuery('(max-width: 599.99px)')

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-gray-200 p-3 pr-1">
        <span className="text-xs font-bold md:text-sm">Interactive Graph and Filter</span>
        <div className="ml-auto flex gap-1">
          {search.filtersCount > 0 && (
            <Button
              variant="outline"
              size="xs"
              className="rounded-md !bg-accent-200 !text-xs !px-2"
              onClick={() => dispatch(clearSearch())}
            >
              Clear Filters
            </Button>
          )}
          <Tooltip
            label="Expand your viewing space by hiding the filter panel and focus on the results. To bring back the panel, simply click the menu icon [hamburger icon] located at the top left corner."
            position="top"
            openDelay={2000}
            withArrow
          >
            <Button
              variant="outline"
              color="primary"
              size="xs"
              className="rounded-md !text-xs !px-2"
              onClick={() => dispatch(setLeftDrawerOpen(false))}
              aria-label="Close dialog"
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
