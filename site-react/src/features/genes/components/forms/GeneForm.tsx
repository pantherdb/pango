import type React from 'react';
import { useState, useEffect } from 'react';
import { Autocomplete, TextField, Chip, Tooltip } from '@mui/material';
import { IoClose } from 'react-icons/io5';
import { SearchFilterType } from '@/features/search/search';
import { addItem, removeItem } from '@/features/search/searchSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { RootState } from '@/app/store/store';
import type { Gene } from '../../models/gene';
import { AutocompleteType } from '../../models/gene';
import { useGetAutocompleteQuery } from '@/features/annotations/slices/annotationsApiSlice';



const GeneForm: React.FC<{ maxGenes?: number }> = ({ maxGenes = 10 }) => {
  const dispatch = useAppDispatch();
  const selectedGenes = useAppSelector((state: RootState) => state.search.genes);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data: suggestions = [], isFetching } = useGetAutocompleteQuery({
    type: AutocompleteType.GENE,
    keyword: debouncedValue
  }, {
    skip: !debouncedValue || debouncedValue.length < 2
  });

  const handleSelect = (_: unknown, newValue: Gene | null) => {
    if (newValue && selectedGenes.length < maxGenes) {
      dispatch(addItem({ type: SearchFilterType.GENES, item: newValue }));
      setInputValue('');
      setOpen(false);
    }
  };

  const handleDelete = (geneToDelete: Gene) => {
    dispatch(removeItem({ type: SearchFilterType.GENES, id: geneToDelete.gene }));
  };

  const renderTags = (tagValue: Gene[], getTagProps: any) =>
    tagValue.map((option, index) => (
      <Chip
        {...getTagProps({ index })}
        key={option.gene}
        label={
          <Tooltip title={`${option.gene} (${option.geneName})`} placement="top" enterDelay={2000}>
            <div className="text-xs w-full flex flex-col items-start">
              <div className="w-full flex items-center">
                <div className="text-xs mr-1">
                  {option.gene}
                </div>
                <div className="font-bold">
                  <strong>({option.geneSymbol})</strong>
                </div>
              </div>
              <div className=" text-gray-500 w-full">
                {option.geneName}
              </div>
            </div>
          </Tooltip>
        }
        onDelete={() => handleDelete(option)}
        deleteIcon={<IoClose size={16} />}
        size="small"
        className="h-7"
      />
    ));

  const renderOption = (props: React.HTMLAttributes<HTMLLIElement>, option: Gene) => (
    <li {...props} key={option.gene} className="cursor-pointer flex flex-col  p-4 border-b border-primary-300 hover:bg-primary-100 hover:font-bold">
      <div className="flex justify-between">
        <span>{option.gene}</span>
        <span className="text-sm text-gray-600">({option.geneSymbol})</span>
      </div>
      <div className="text-sm text-gray-500">{option.geneName}</div>
    </li>
  );

  return (
    <div className="w-full p-2">
      <Autocomplete
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        multiple
        freeSolo
        clearIcon={null}
        options={suggestions}
        value={selectedGenes}
        inputValue={inputValue}
        onInputChange={(_, newValue) => {
          setInputValue(newValue);
          if (newValue.length >= 2) setOpen(true);
        }}
        onChange={(_, __, reason, details) => {
          if (reason === 'selectOption' && details?.option) {
            handleSelect(null, details.option as Gene);
          }
        }}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option.gene || '';
        }}
        loading={isFetching}
        filterOptions={(x) => x}
        disabled={selectedGenes.length >= maxGenes}
        renderTags={renderTags}
        renderOption={renderOption}
        noOptionsText="Type to search genes..."
        ListboxProps={{
          className: 'bg-accent-50 max-h-[300px] overflow-y-auto',
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Filter by Gene"
            placeholder="Type to search genes..."
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

export default GeneForm;