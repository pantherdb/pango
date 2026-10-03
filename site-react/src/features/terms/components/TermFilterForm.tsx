import type React from 'react'
import { useState, useMemo } from 'react'
import { SearchFilterType } from '@/features/search/search'
import { addItem, removeItem } from '@/features/search/searchSlice'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import type { RootState } from '@/app/store/store'
import type { CategoryTerm, Term } from '../models/term'
import {
  Combobox,
  Pill,
  PillsInput,
  Tooltip,
  useCombobox,
} from '@mantine/core'

const TermForm: React.FC<{ maxTerms?: number }> = ({ maxTerms = 10 }) => {
  const dispatch = useAppDispatch()
  const selectedTerms = useAppSelector((state: RootState) => state.search.slimTerms)
  const categories = useAppSelector(state => state.terms.functionCategories)
  const [inputValue, setInputValue] = useState('')
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })

  const filteredTerms = useMemo(() => {
    if (!inputValue || inputValue.length < 2) return []
    const searchValue = inputValue.toLowerCase()
    return categories
      ?.filter(
        term =>
          !selectedTerms.some(selected => selected.id === term.id) &&
          (term.id.toLowerCase().includes(searchValue) ||
            term.label.toLowerCase().includes(searchValue))
      )
      .slice(0, 10)
  }, [inputValue, categories, selectedTerms])

  const disabled = selectedTerms.length >= maxTerms

  const handleSelect = (termId: string) => {
    const term = filteredTerms.find(t => t.id === termId)
    if (term && selectedTerms.length < maxTerms) {
      dispatch(addItem({ type: SearchFilterType.SLIM_TERMS, item: term }))
      setInputValue('')
      combobox.closeDropdown()
    }
  }

  const handleDelete = (termToDelete: Term) => {
    dispatch(
      removeItem({
        type: SearchFilterType.SLIM_TERMS,
        id: termToDelete.id,
      })
    )
  }

  const pills = selectedTerms.map(option => {
    const term = option as CategoryTerm
    const truncatedLabel =
      term.label.length > 20 ? `${term.label.substring(0, 20)}...` : term.label
    return (
      <Tooltip key={term.id} label={term.label} position="top" openDelay={2000}>
        <Pill
          withRemoveButton
          onRemove={() => handleDelete(term)}
          className="!h-7"
        >
          <span className="flex items-center gap-2">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold"
              style={{
                borderColor: term.color,
                color: term.color,
                backgroundColor: `${term.color}20`,
              }}
            >
              {term.aspectShorthand}
            </span>
            <span className="text-xs text-gray-600">{truncatedLabel}</span>
          </span>
        </Pill>
      </Tooltip>
    )
  })

  const options = filteredTerms.map(option => (
    <Combobox.Option
      key={option.id}
      value={option.id}
      className="flex cursor-pointer items-center justify-between border-b border-primary-300 p-4 hover:bg-primary-100 hover:font-bold"
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold"
          style={{
            borderColor: option.color,
            color: option.color,
            backgroundColor: `${option.color}20`,
          }}
        >
          {option.aspectShorthand}
        </span>
        <div>
          <span className="text-sm">{option.label}</span>
          {option.displayId && (
            <span className="ml-2 text-xs italic text-gray-500">{option.displayId}</span>
          )}
        </div>
      </div>
      <span className="text-xs text-gray-500">{option.count} genes</span>
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
            placeholder="Type to Search..."
            onClick={() => combobox.openDropdown()}
            classNames={{ input: 'bg-white' }}
            disabled={disabled}
          >
            <Pill.Group>
              {pills}
              <Combobox.EventsTarget>
                <PillsInput.Field
                  onFocus={() => combobox.openDropdown()}
                  onBlur={() => combobox.closeDropdown()}
                  value={inputValue}
                  placeholder={disabled ? `Max ${maxTerms} categories selected` : 'Type to Search...'}
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
              <Combobox.Empty>Type to search categories...</Combobox.Empty>
            ) : (
              options
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </div>
  )
}

export default TermForm
