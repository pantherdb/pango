import type React from 'react'
import { useState, useEffect } from 'react'
import { SearchFilterType } from '@/features/search/search'
import { addItem, removeItem } from '@/features/search/searchSlice'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import type { RootState } from '@/app/store/store'
import type { Gene } from '../../models/gene'
import { AutocompleteType } from '../../models/gene'
import { useGetAutocompleteQuery } from '../../slices/genesApiSlice'
import {
  Combobox,
  Loader,
  Pill,
  PillsInput,
  Tooltip,
  useCombobox,
} from '@mantine/core'

const GeneForm: React.FC<{ maxGenes?: number }> = ({ maxGenes = 10 }) => {
  const dispatch = useAppDispatch()
  const selectedGenes = useAppSelector((state: RootState) => state.search.genes)
  const [inputValue, setInputValue] = useState('')
  const [debouncedValue, setDebouncedValue] = useState('')
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue)
    }, 300)
    return () => clearTimeout(timer)
  }, [inputValue])

  const { data: geneData = [], isFetching } = useGetAutocompleteQuery(
    {
      type: AutocompleteType.GENE,
      keyword: debouncedValue,
    },
    {
      skip: !debouncedValue || debouncedValue.length < 2,
    }
  )

  const suggestions: Gene[] = geneData?.genes ?? []
  const disabled = selectedGenes.length >= maxGenes

  const handleSelect = (geneId: string) => {
    const gene = suggestions.find(g => g.gene === geneId)
    if (gene && selectedGenes.length < maxGenes) {
      dispatch(addItem({ type: SearchFilterType.GENES, item: gene }))
      setInputValue('')
      combobox.closeDropdown()
    }
  }

  const handleDelete = (geneToDelete: Gene) => {
    dispatch(removeItem({ type: SearchFilterType.GENES, id: geneToDelete.gene }))
  }

  const pills = selectedGenes.map(option => (
    <Tooltip
      key={option.gene}
      label={`${option.gene} (${option.geneName})`}
      position="top"
      openDelay={2000}
      withArrow
    >
      <Pill
        withRemoveButton
        onRemove={() => handleDelete(option)}
        className="!h-7"
      >
        <span className="flex w-full flex-col items-start text-xs">
          <span className="flex w-full items-center">
            <span className="mr-1 text-xs">{option.gene}</span>
            <span className="font-bold">
              <strong>({option.geneSymbol})</strong>
            </span>
          </span>
          <span className="w-full text-gray-500">{option.geneName}</span>
        </span>
      </Pill>
    </Tooltip>
  ))

  const options = suggestions.map(option => (
    <Combobox.Option
      value={option.gene}
      key={option.gene}
      className="flex cursor-pointer flex-col border-b border-primary-300 p-4 hover:bg-primary-100 hover:font-bold"
    >
      <div className="flex justify-between">
        <span>{option.gene}</span>
        <span className="text-sm text-gray-600">({option.geneSymbol})</span>
      </div>
      <div className="text-sm text-gray-500">{option.geneName}</div>
    </Combobox.Option>
  ))

  return (
    <div className="w-full p-2">
      <Combobox store={combobox} onOptionSubmit={handleSelect} width="target" position="bottom-start">
        <Combobox.DropdownTarget>
          <PillsInput
            label="Filter by Gene"
            onClick={() => combobox.openDropdown()}
            classNames={{ input: 'bg-white' }}
            disabled={disabled}
            rightSection={isFetching ? <Loader size="xs" /> : null}
          >
            <Pill.Group>
              {pills}
              <Combobox.EventsTarget>
                <PillsInput.Field
                  onFocus={() => combobox.openDropdown()}
                  onBlur={() => combobox.closeDropdown()}
                  value={inputValue}
                  placeholder={
                    disabled ? `Max ${maxGenes} genes selected` : 'Type to search genes...'
                  }
                  onChange={e => {
                    setInputValue(e.currentTarget.value)
                    if (e.currentTarget.value.length >= 2) combobox.openDropdown()
                  }}
                  disabled={disabled}
                />
              </Combobox.EventsTarget>
            </Pill.Group>
          </PillsInput>
        </Combobox.DropdownTarget>

        <Combobox.Dropdown className="!bg-accent-50 !max-h-[300px] overflow-y-auto">
          <Combobox.Options>
            {options.length === 0 ? (
              <Combobox.Empty>Type to search genes...</Combobox.Empty>
            ) : (
              options
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </div>
  )
}

export default GeneForm
