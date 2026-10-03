import type React from 'react'
import { useState, useEffect } from 'react'
import { AutocompleteType } from '../models/gene'
import { useGetAutocompleteQuery } from '../slices/genesApiSlice'
import GeneResults from './GeneResults'
import { Combobox, Loader, TextInput, useCombobox } from '@mantine/core'

interface GeneSearchProps {
  isOpen: boolean
  onClose?: () => void
  popoverRef?: React.RefObject<HTMLDivElement>
}

const GeneSearch: React.FC<GeneSearchProps> = ({ isOpen }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedValue, setDebouncedValue] = useState('')
  const combobox = useCombobox()

  useEffect(() => {
    if (searchQuery.length >= 2) combobox.openDropdown()
    else combobox.closeDropdown()
  }, [searchQuery, combobox])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: geneData = [], isFetching } = useGetAutocompleteQuery(
    {
      type: AutocompleteType.GENE,
      keyword: debouncedValue,
    },
    {
      skip: !debouncedValue || debouncedValue.length < 2,
    }
  )

  const genes = geneData?.genes ?? []

  if (!isOpen) return null

  return (
    <div className="w-full animate-[fadeIn_0.3s_ease-in-out] flex-col transition-all duration-300">
      <Combobox store={combobox} width="target" position="bottom-start">
        <Combobox.Target>
          <TextInput
            autoComplete="off"
            value={searchQuery}
            onChange={e => setSearchQuery(e.currentTarget.value)}
            placeholder="Enter gene name..."
            autoFocus
            classNames={{ input: 'bg-white' }}
            rightSection={isFetching ? <Loader size="xs" /> : null}
          />
        </Combobox.Target>

        <Combobox.Dropdown className="!max-h-[400px] overflow-y-auto !bg-accent-50 shadow-lg">
          {genes.length > 0 ? (
            <GeneResults genes={genes} />
          ) : (
            <div className="p-4 text-center text-gray-500">No genes found</div>
          )}
        </Combobox.Dropdown>
      </Combobox>
    </div>
  )
}

export default GeneSearch
