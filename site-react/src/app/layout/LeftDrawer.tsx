import type React from 'react'
import { useAppDispatch, useAppSelector } from '../hooks'
import { setLeftDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice'
import { clearSearch } from '@/features/search/searchSlice'
import CategoryStats from '@/shared/components/CategoryStats'
import theme from '@/@pango.core/theme/theme'
import useMediaQuery from '@mui/system/useMediaQuery'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'

// TODO clear filter so aspect selection
const LeftDrawerContent: React.FC = () => {
  const dispatch = useAppDispatch()
  const search = useAppSelector(state => state.search)
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-gray-200 p-3 pr-1">
        <span className="text-xs font-bold md:text-sm">Interactive Graph and Filter</span>
        <div className="ml-auto flex gap-1">
          {search.filtersCount > 0 && (
            <Button
              variant="outlined"
              className="rounded-md !bg-accent-200 !text-xs !px-2"
              onClick={() => dispatch(clearSearch())}
            >
              Clear Filters
            </Button>
          )}
          <Tooltip
            title="Expand your viewing space by hiding the filter panel and focus on the results. To bring back the panel, simply click the menu icon [hamburger icon] located at the top left corner."
            placement="top"
            enterDelay={2000}
            arrow
          >
            <Button
              variant="outlined"
              color="primary"
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
