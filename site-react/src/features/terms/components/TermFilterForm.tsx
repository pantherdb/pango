import type React from 'react'
import { useMemo, useState } from 'react'
import { Combobox, Pill, PillsInput, Tooltip, useCombobox } from '@mantine/core'
import { SearchFilterType } from '@/features/search/search'
import { addItem, removeItem } from '@/features/search/searchSlice'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { FilterPill } from '@/shared/components/FilterPill'
import type { CategoryTerm } from '../models/term'

const MIN_QUERY_LENGTH = 2
const MAX_OPTIONS = 10
const PILL_LABEL_LENGTH = 20

const truncate = (label: string) =>
  label.length > PILL_LABEL_LENGTH ? `${label.substring(0, PILL_LABEL_LENGTH)}...` : label

const AspectCircle = ({ term, className }: { term: CategoryTerm; className: string }) => (
  <span
    className={`flex items-center justify-center rounded-full border text-xs font-bold ${className}`}
    style={{ borderColor: term.color, color: term.color, backgroundColor: `${term.color}20` }}
  >
    {term.aspectShorthand}
  </span>
)

const TermFilterForm: React.FC<{ maxTerms?: number }> = ({ maxTerms = 10 }) => {
  const dispatch = useAppDispatch()
  const selectedTerms = useAppSelector(state => state.search.slimTerms)
  const categories = useAppSelector(state => state.terms.functionCategories)
  const [inputValue, setInputValue] = useState('')
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })

  const filteredTerms = useMemo(() => {
    const searchValue = inputValue.trim().toLowerCase()
    if (searchValue.length < MIN_QUERY_LENGTH) return []
    return categories
      .filter(
        term =>
          !selectedTerms.some(selected => selected.id === term.id) &&
          (term.id.toLowerCase().includes(searchValue) ||
            term.label.toLowerCase().includes(searchValue))
      )
      .slice(0, MAX_OPTIONS)
  }, [inputValue, categories, selectedTerms])

  const isFull = selectedTerms.length >= maxTerms

  const handleSelect = (termId: string) => {
    const term = filteredTerms.find(t => t.id === termId)
    if (term && !isFull) {
      dispatch(addItem({ type: SearchFilterType.SLIM_TERMS, item: term }))
      setInputValue('')
      combobox.closeDropdown()
    }
  }

  const handleRemove = (term: CategoryTerm) => {
    dispatch(removeItem({ type: SearchFilterType.SLIM_TERMS, id: term.id }))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace in an empty field removes the last category, as in Mantine's MultiSelect.
    if (event.key === 'Backspace' && inputValue.length === 0 && selectedTerms.length > 0) {
      event.preventDefault()
      handleRemove(selectedTerms[selectedTerms.length - 1])
    }
  }

  const pills = selectedTerms.map(term => (
    <Tooltip key={term.id} label={term.label} openDelay={2000}>
      <FilterPill
        className="h-7"
        onRemove={() => handleRemove(term)}
        removeLabel={`Remove ${term.label}`}
      >
        <span className="flex items-center gap-2">
          <AspectCircle term={term} className="h-5 w-5" />
          <span className="text-xs text-gray-600">{truncate(term.label)}</span>
        </span>
      </FilterPill>
    </Tooltip>
  ))

  const options = filteredTerms.map(term => (
    <Combobox.Option
      key={term.id}
      value={term.id}
      className="flex items-center justify-between border-b border-primary-300 px-4 py-1.5 hover:bg-primary-100 hover:font-bold data-[combobox-selected]:bg-primary-100 data-[combobox-selected]:text-inherit"
    >
      <div className="flex items-center gap-2">
        <AspectCircle term={term} className="h-6 w-6" />
        <div>
          <span className="text-sm">{term.label}</span>
          {term.displayId && (
            <span className="ml-2 text-xs text-gray-500 italic">{term.displayId}</span>
          )}
        </div>
      </div>
      <span className="text-xs text-gray-500">{term.count} genes</span>
    </Combobox.Option>
  ))

  return (
    <div className="w-full p-2">
      <Combobox
        store={combobox}
        onOptionSubmit={handleSelect}
        width="target"
        position="bottom-start"
      >
        <Combobox.DropdownTarget>
          <PillsInput
            label="Add filter(s) by typing category here, or clicking a category below"
            onClick={() => {
              if (!isFull) combobox.openDropdown()
            }}
          >
            <Pill.Group>
              {pills}
              <Combobox.EventsTarget>
                <PillsInput.Field
                  value={inputValue}
                  placeholder={isFull ? `Max ${maxTerms} categories selected` : 'Type to Search...'}
                  disabled={isFull}
                  onFocus={() => combobox.openDropdown()}
                  onBlur={() => combobox.closeDropdown()}
                  onKeyDown={handleKeyDown}
                  onChange={event => {
                    setInputValue(event.currentTarget.value)
                    combobox.openDropdown()
                    combobox.updateSelectedOptionIndex()
                  }}
                />
              </Combobox.EventsTarget>
            </Pill.Group>
          </PillsInput>
        </Combobox.DropdownTarget>

        <Combobox.Dropdown className="max-h-[300px] overflow-y-auto bg-accent-50">
          <Combobox.Options>
            {options.length > 0 ? (
              options
            ) : (
              <Combobox.Empty>Type to search categories...</Combobox.Empty>
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </div>
  )
}

export default TermFilterForm
