import type React from 'react';
import { useState, useMemo } from 'react';
import type { AutocompleteChangeReason, AutocompleteChangeDetails } from '@mui/material';
import { Autocomplete, TextField, Chip, Tooltip } from '@mui/material';
import { IoClose } from 'react-icons/io5';
import { SearchFilterType } from '@/features/search/search';
import { addItem, removeItem } from '@/features/search/searchSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { RootState } from '@/app/store/store';
import type { CategoryTerm, Term } from '../models/term';

// TODO delete not delting

const renderOption = (props: React.HTMLAttributes<HTMLLIElement>, option: CategoryTerm) => {
  const { key, ...otherProps } = props;
  return (
    <li key={option.id} {...otherProps} className="flex items-center justify-between p-2 hover:bg-primary-100">
      <div className="flex items-center gap-2">
        <span
          className="flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold border"
          style={{
            borderColor: option.color,
            color: option.color,
            backgroundColor: `${option.color}20`
          }}>
          {option.aspectShorthand}
        </span>
        <div>
          <span className="text-sm">{option.label}</span>
          {option.displayId && (
            <span className="ml-2 text-gray-500 text-xs italic">
              {option.displayId}
            </span>
          )}
        </div>
      </div>
      <span className="text-xs text-gray-500">{option.count}</span>
    </li>
  );
};

const TermForm: React.FC<{ maxTerms?: number }> = ({ maxTerms = 10 }) => {
  const dispatch = useAppDispatch();
  const selectedTerms = useAppSelector((state: RootState) => state.search.slimTerms);
  const categories = useAppSelector(state => state.terms.functionCategories);
  const [inputValue, setInputValue] = useState('');

  const filteredTerms = useMemo(() => {
    if (!inputValue || inputValue.length < 2) return [];
    const searchValue = inputValue.toLowerCase();
    return categories?.filter(term =>
      !selectedTerms.some(selected => selected.id === term.id) &&
      (term.id.toLowerCase().includes(searchValue) ||
        term.label.toLowerCase().includes(searchValue))
    ).slice(0, 10);
  }, [inputValue, categories, selectedTerms]);

  const handleChange = (
    _: React.SyntheticEvent,
    newValue: (string | CategoryTerm)[],
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<CategoryTerm>
  ) => {
    if (reason === 'selectOption' && details?.option) {
      dispatch(addItem({
        type: SearchFilterType.SLIM_TERMS,
        item: details.option
      }));
    }
  };

  const handleDelete = (termToDelete: Term) => {
    dispatch(removeItem({
      type: SearchFilterType.SLIM_TERMS,
      id: termToDelete.id
    }));
  };

  const renderTags = (tagValue: CategoryTerm[], getTagProps: any) =>
    tagValue.map((option, index) => (
      <Chip
        {...getTagProps({ index })}
        key={option.id}
        label={
          <Tooltip
            title={`${option.label} (${option.id})`}
            placement="top"
            enterDelay={2000}
          >
            <span className="flex items-center gap-2">
              <span
                className="flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold border"
                style={{
                  borderColor: option.color,
                  color: option.color,
                  backgroundColor: `${option.color}20`
                }}>
                {option.aspectShorthand}
              </span>
              <span className="text-xs">{option.id}</span>
              <span className="text-xs text-gray-600">({option.label})</span>
            </span>
          </Tooltip>
        }
        onDelete={() => handleDelete(option)}
        deleteIcon={<IoClose size={16} />}
        size="small"
        className="h-7"
      />
    ));

  return (
    <div className="w-full p-2">
      <Autocomplete
        clearIcon={null}
        multiple
        freeSolo
        disableCloseOnSelect
        value={selectedTerms}
        onChange={handleChange}
        onInputChange={(_, value) => setInputValue(value)}
        options={filteredTerms}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option.label || '';
        }}
        disabled={selectedTerms.length >= maxTerms}
        renderTags={renderTags}
        renderOption={renderOption}
        ListboxProps={{
          className: 'bg-accent-50 max-h-[300px] overflow-y-auto'
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Add filter(s) by typing category here, or clicking a category below"
            placeholder='Type to Search...'
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              sx: { bgcolor: 'white' }
            }}
          />
        )}
      />
    </div>
  );
};

export default TermForm;