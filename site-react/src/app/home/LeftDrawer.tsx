import type React from 'react';
import {
  Button,
  Tooltip,
} from '@mui/material';
import CategoryStats from '../genes/CategoryStats';
import { useAppDispatch } from '../hooks';
import { setLeftDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice';


const LeftDrawerContent: React.FC = () => {
  const dispatch = useAppDispatch()
  const onClearFilters = () => {
    // TODO implement clear filters
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center border-b border-gray-200">
        <span className="text-lg font-medium">Filter Options</span>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outlined"
            color="error"
            size="small"
            className="rounded-md min-w-[100px]"
            onClick={onClearFilters}
          >
            Clear All Filters
          </Button>
          <Tooltip
            title="Expand your viewing space by hiding the filter panel and focus on the results. To bring back the panel, simply click the menu icon [hamburger icon] located at the top left corner."
            placement="top"
            enterDelay={3000}
          >
            <Button
              variant="outlined"
              color="primary"
              size="small"
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