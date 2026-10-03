import type React from 'react'
import { useState, useEffect } from 'react'
import { SearchFilterType } from '@/features/search/search'
import { addItem, removeItem } from '@/features/search/searchSlice'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import type { RootState } from '@/app/store/store'
import { AutocompleteType } from '@/features/annotations/models/annotation'
import { useGetSlimTermsAutocompleteQuery } from '@/features/annotations/slices/annotationsApiSlice'
import type { Term } from '../models/term'
import { ASPECT_MAP } from '@/@pango.core/data/config'
import {
  Combobox,
  Loader,
  Paper,
  Pill,
  PillsInput,
  Tooltip,
  useCombobox,
} from '@mantine/core'

interface TermFormProps {
  maxTerms?: number
}

const TermForm: React.FC<TermFormProps> = ({ maxTerms = 10 }) => {
  const dispatch = useAppDispatch()
  const selectedTerms = useAppSelector((state: RootState) => state.search.slimTerms)
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

  const { data: suggestions = [], isFetching } = useGetSlimTermsAutocompleteQuery(
    {
      type: AutocompleteType.SLIM_TERM,
      keyword: debouncedValue,
    },
    {
      skip: !debouncedValue || debouncedValue.length < 2,
    }
  )

  const disabled = selectedTerms.length >= maxTerms

  const handleSelect = (termId: string) => {
    const term = suggestions.find(t => t.id === termId)
    if (term && selectedTerms.length < maxTerms) {
      dispatch(addItem({ type: SearchFilterType.SLIM_TERMS, item: term }))
      setInputValue('')
      combobox.closeDropdown()
    }
  }

  const handleDelete = (termToDelete: Term) => {
    dispatch(removeItem({ type: SearchFilterType.SLIM_TERMS, id: termToDelete.id }))
  }

  const pills = selectedTerms.map(term => (
    <Pill key={term.id} withRemoveButton onRemove={() => handleDelete(term)} className="mx-1">
      <div className="flex flex-col py-0.5">
        <div className="flex items-center gap-1">
          <span>{term.id}</span>
          <span className="text-xs">({term.label})</span>
        </div>
        <span className="text-xs text-gray-600">{term.label}</span>
      </div>
    </Pill>
  ))

  const options = suggestions.map((term: Term) => (
    <Combobox.Option
      key={term.id}
      value={term.id}
      className="flex items-center py-2 last:mb-0"
    >
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold"
        style={{
          borderColor: ASPECT_MAP[term.aspect]?.color,
          color: ASPECT_MAP[term.aspect]?.color,
          backgroundColor: `${ASPECT_MAP[term.aspect]?.color}20`,
        }}
      >
        {ASPECT_MAP[term.aspect]?.shorthand}
      </span>
      <div className="ml-2">
        <span className="text-sm">{term.label}</span>
        {term.displayId && (
          <div className="ml-2 text-xs italic text-gray-500 hover:text-gray-700">
            {term.displayId}
          </div>
        )}
      </div>
    </Combobox.Option>
  ))

  return (
    <Paper className="w-full bg-white">
      <Tooltip
        label="Find all functional characteristics for a term of interest"
        position="top"
        openDelay={1500}
        withArrow
      >
        <Combobox
          store={combobox}
          onOptionSubmit={handleSelect}
          width="target"
          position="bottom-start"
        >
          <Combobox.DropdownTarget>
            <PillsInput
              label="Filter by Term"
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
                      disabled ? `Max ${maxTerms} terms selected` : 'Type to search terms...'
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

          <Combobox.Dropdown>
            <Combobox.Options>
              {options.length === 0 ? (
                <Combobox.Empty>Type to search terms...</Combobox.Empty>
              ) : (
                options
              )}
            </Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
      </Tooltip>
    </Paper>
  )
}

export default TermForm
