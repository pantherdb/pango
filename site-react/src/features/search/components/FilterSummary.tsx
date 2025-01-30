import { Chip, Tooltip } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { SearchFilterType } from '../search';
import { clearSearch, removeItem } from '../searchSlice';

const FilterSummary = () => {
  const dispatch = useAppDispatch();
  const search = useAppSelector((state) => state.search);

  const clearAllFilters = () => {
    dispatch(clearSearch());
  };

  const removeFilter = (filterType: SearchFilterType) => {
    const items = search[filterType];
    items.forEach(item => {
      dispatch(removeItem({
        type: filterType,
        id: filterType === SearchFilterType.GENES ? item.gene : item.id
      }));
    });
  };

  if (search.filtersCount === 0) {
    return (
      <span className="text-gray-500 italic text-xs">
        No Filters selected: You can filter the list to find a specific gene or function category.
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <small className="mr-3 text-xs">Filtered By:</small>
      <Chip onClick={clearAllFilters}
        label="Clear All Filters"
        className="!h-7 !text-xs !bg-accent-300"
        size="small"
      />
      {search.genes.length > 0 && (
        <Tooltip title={search.tooltips.genes} enterDelay={1500} placement="bottom" arrow>
          <Chip
            label={`Genes (${search.genes.length})`}
            onDelete={() => removeFilter(SearchFilterType.GENES)}
            className="!h-7 !text-xs"
            size="small"
          />
        </Tooltip>
      )}
      {search.slimTerms.length > 0 && (
        <Tooltip title={search.tooltips.slimTerms} enterDelay={1500} placement="bottom" arrow>
          <Chip
            label={`Categories (${search.slimTerms.length})`}
            onDelete={() => removeFilter(SearchFilterType.SLIM_TERMS)}
            className="!h-7 !text-xs"
            size="small"
          />
        </Tooltip>
      )}
    </div>
  );
};

export default FilterSummary;