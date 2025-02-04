import type React from 'react';
import {
  Button,
  Tooltip,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setLeftDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice';
import { clearSearch } from '@/features/search/searchSlice';
import CategoryStats from '@/shared/components/CategoryStats';

// TODO clear filter so aspect selection
const LeftDrawerContent: React.FC = () => {
  const dispatch = useAppDispatch()
  const search = useAppSelector((state) => state.search);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center border-b border-gray-200">
        <span className="text-lg font-medium">Filter Options</span>
        <div className="ml-auto flex gap-2">
          {search.filtersCount > 0 && (<Button
            variant="outlined"
            className=" !bg-accent-200 rounded-md min-w-[100px]"
            onClick={() => dispatch(clearSearch())}
          >
            Clear All Filters
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
              className="rounded-md"
              onClick={() => dispatch(setLeftDrawerOpen(false))}
              aria-label="Close dialog"
            >
              Close
            </Button>
          </Tooltip>
        </div>
      </div>
      <CategoryStats />
    </div>
  );
};

export default LeftDrawerContent;