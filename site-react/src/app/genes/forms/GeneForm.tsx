
// GeneForm updated to use search state
import type React from 'react';
import { useState, useEffect } from 'react';
import { Autocomplete, TextField, Chip, Tooltip, Paper } from '@mui/material';
import { IoClose } from 'react-icons/io5';
import { useGetAutocompleteQuery } from '@/app/annotations/annotationsApiSlice';
import type { Gene } from '../models/gene';
import { AutocompleteType } from '../models/gene';
import { SearchFilterType } from '@/features/search/search';
import { addItem, removeItem } from '@/features/search/searchSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { RootState } from '@/app/store/store';

interface GeneFormProps {
  maxGenes?: number;
}

const GeneForm: React.FC<GeneFormProps> = ({ maxGenes = 10 }) => {
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

  const handleSelect = (_: unknown, gene: Gene | null) => {
    if (gene && selectedGenes.length < maxGenes) {
      dispatch(addItem({ type: SearchFilterType.GENES, item: gene }));
      setInputValue('');
      setOpen(false);
    }
  };

  const handleDelete = (geneToDelete: Gene) => {
    dispatch(removeItem({ type: SearchFilterType.GENES, id: geneToDelete.gene }));
  };

  return (
    <Paper className="w-full bg-white">
      <Tooltip
        title="Find all functional characteristics for a gene of interest"
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
          getOptionLabel={(option: Gene) => option.gene}
          loading={isFetching}
          filterOptions={(x) => x}
          disabled={selectedGenes.length >= maxGenes}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by Gene"
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                sx: { bgcolor: 'white' },
                startAdornment: (
                  <>
                    {selectedGenes.map((gene) => (
                      <Chip
                        key={gene.gene}
                        size="small"
                        label={
                          <div className="flex flex-col py-0.5">
                            <div className="flex items-center gap-1">
                              <span>{gene.gene}</span>
                              <span className="text-xs">({gene.geneSymbol})</span>
                            </div>
                            <span className="text-xs text-gray-600">{gene.geneName}</span>
                          </div>
                        }
                        onDelete={() => handleDelete(gene)}
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
          renderOption={(optionProps, option: Gene) => {
            const { key, ...props } = optionProps;
            return (
              <li key={option.gene} {...props}>
                <div className="flex flex-col w-full p-2">
                  <div className="flex justify-between">
                    <span>{option.gene}</span>
                    <span className="text-sm text-gray-600">({option.geneSymbol})</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {option.geneName}
                  </div>
                </div>
              </li>
            );
          }}
          noOptionsText="Type to search genes..."
        />
      </Tooltip>
    </Paper>
  );
};

export default GeneForm;