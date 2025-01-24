import type React from 'react';
import { useState, useEffect } from 'react';
import { Autocomplete, TextField, Chip, Tooltip, Paper } from '@mui/material';
import { IoClose } from 'react-icons/io5';
import { useGetSlimTermsAutocompleteQuery } from '@/app/annotations/annotationsApiSlice';
import type { Term } from '../models/term';
import { SearchFilterType } from '@/features/search/search';
import { addItem, removeItem } from '@/features/search/searchSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { RootState } from '@/app/store/store';
import { AutocompleteType } from '../models/gene';

interface TermFormProps {
  maxTerms?: number;
}

const TermForm: React.FC<TermFormProps> = ({ maxTerms = 10 }) => {
  const dispatch = useAppDispatch();
  const selectedTerms = useAppSelector((state: RootState) => state.search.slimTerms);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data: suggestions = [], isFetching } = useGetSlimTermsAutocompleteQuery({
    type: AutocompleteType.SLIM_TERM,
    keyword: debouncedValue
  }, {
    skip: !debouncedValue || debouncedValue.length < 2
  });

  const handleSelect = (_: unknown, term: Term | null) => {
    if (term && selectedTerms.length < maxTerms) {
      dispatch(addItem({ type: SearchFilterType.SLIM_TERMS, item: term }));
      setInputValue('');
      setOpen(false);
    }
  };

  const handleDelete = (termToDelete: Term) => {
    dispatch(removeItem({ type: SearchFilterType.SLIM_TERMS, id: termToDelete.id }));
  };

  return (
    <Paper className="w-full bg-white">
      <Tooltip
        title="Find all functional characteristics for a term of interest"
        placement="top"
        enterDelay={1500}
      >
        <Autocomplete
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          options={suggestions}
          value={null}
          inputValue={inputValue}
          onInputChange={(_, newValue) => {
            setInputValue(newValue);
            if (newValue.length >= 2) setOpen(true);
          }}
          onChange={handleSelect}
          getOptionLabel={(option: Term) => option.label}
          loading={isFetching}
          filterOptions={(x) => x}
          disabled={selectedTerms.length >= maxTerms}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by Term"
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                sx: { bgcolor: 'white' },
                startAdornment: (
                  <>
                    {selectedTerms.map((term) => (
                      <Chip
                        key={term.id}
                        size="small"
                        label={
                          <div className="flex flex-col py-0.5">
                            <div className="flex items-center gap-1">
                              <span>{term.id}</span>
                              <span className="text-xs">({term.label})</span>
                            </div>
                            <span className="text-xs text-gray-600">{term.label}</span>
                          </div>
                        }
                        onDelete={() => handleDelete(term)}
                        deleteIcon={<IoClose size={16} />}
                        className="mx-1"
                      />
                    ))}
                    {params.InputProps.startAdornment}
                  </>
                )
              }}
            />
          )}
          renderOption={(optionProps, option: Term) => {
            const { key, ...props } = optionProps;
            return (
              <li key={option.id} {...props}>
                <div className="flex flex-col w-full p-2">
                  <div className="flex justify-between">
                    <span>{option.id}</span>
                    <span className="text-sm text-gray-600">({option.label})</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {option.id}
                  </div>
                </div>
              </li>
            );
          }}
          noOptionsText="Type to search terms..."
        />
      </Tooltip>
    </Paper>
  );
};

export default TermForm;