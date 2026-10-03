import type React from 'react'
import { useState } from 'react'
import { Combobox, Loader, TextInput, useCombobox } from '@mantine/core'
import { useClickOutside, useDebouncedValue } from '@mantine/hooks'
import type { Gene } from '../models/gene'
import { AutocompleteType } from '../models/gene'
import { useGetAutocompleteQuery } from '../slices/genesApiSlice'
import GeneResults from './GeneResults'

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 300

export type GeneSearchCloseReason = 'escape' | 'outside'

interface GeneSearchProps {
  /**
   * Makes the search dismissible: called on Escape or on a press outside the search. Without it
   * the field stays in place (the inline search on the home page).
   */
  onClose?: (reason: GeneSearchCloseReason) => void
  /**
   * Element whose presses count as inside the search, e.g. a toolbar row that also holds a close
   * button. Defaults to the field itself; the results dropdown always counts as inside.
   */
  area?: HTMLElement | null
}

const GeneSearch: React.FC<GeneSearchProps> = ({ onClose, area }) => {
  const [query, setQuery] = useState('')
  const trimmedQuery = query.trim()
  const [debouncedQuery] = useDebouncedValue(trimmedQuery, DEBOUNCE_MS)
  const combobox = useCombobox()

  // State-backed refs: the results dropdown mounts in a portal after the field, and the
  // click-outside check has to see both nodes as soon as they exist.
  const [field, setField] = useState<HTMLDivElement | null>(null)
  const [dropdown, setDropdown] = useState<HTMLDivElement | null>(null)
  const inside = area ?? field
  const insideNodes = [inside, dropdown].filter((node): node is HTMLElement => node !== null)
  useClickOutside(() => onClose?.('outside'), null, insideNodes, Boolean(onClose && inside))

  const { data, isFetching } = useGetAutocompleteQuery(
    { type: AutocompleteType.GENE, keyword: debouncedQuery },
    { skip: debouncedQuery.length < MIN_QUERY_LENGTH }
  )
  const genes: Gene[] = data?.genes ?? []
  const isSearching = isFetching || trimmedQuery !== debouncedQuery

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget
    setQuery(value)
    if (value.trim().length >= MIN_QUERY_LENGTH) combobox.openDropdown()
    else combobox.closeDropdown()
  }

  const handleFocus = () => {
    if (trimmedQuery.length >= MIN_QUERY_LENGTH) combobox.openDropdown()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') onClose?.('escape')
  }

  return (
    <div ref={setField} className="w-full animate-fade-in">
      <Combobox store={combobox} width="target" position="bottom-start" shadow="sm">
        <Combobox.Target>
          <TextInput
            value={query}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder="Enter gene name..."
            aria-label="Search genes"
            autoComplete="off"
            autoFocus={Boolean(onClose)}
            rightSection={isFetching ? <Loader size="xs" /> : null}
          />
        </Combobox.Target>

        <Combobox.Dropdown ref={setDropdown} className="max-h-[400px] overflow-y-auto bg-accent-50">
          {genes.length > 0 ? (
            <GeneResults genes={genes} />
          ) : (
            <div className="p-4 text-center text-gray-500">
              {isSearching ? 'Searching…' : 'No genes found'}
            </div>
          )}
        </Combobox.Dropdown>
      </Combobox>
    </div>
  )
}

export default GeneSearch
