import type React from 'react'
import { useState, useEffect, useRef } from 'react'
import { AutocompleteType } from '../models/gene'
import { useGetAutocompleteQuery } from '../slices/genesApiSlice'
import GeneResults from './GeneResults'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'

interface GeneSearchProps {
  isOpen: boolean
  onClose?: () => void
  popoverRef?: React.RefObject<HTMLDivElement>
}

const GeneSearch: React.FC<GeneSearchProps> = ({ isOpen, onClose, popoverRef }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedValue, setDebouncedValue] = useState('')
  const [showResults, setShowResults] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setShowResults(searchQuery.length >= 2)
  }, [searchQuery])

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

  const handleClickAway = () => {
    setShowResults(false)
    // onClose?.()
  }

  if (!isOpen) return null

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div className="w-full animate-[fadeIn_0.3s_ease-in-out] flex-col transition-all duration-300">
        <div ref={anchorRef}>
          <TextField
            autoComplete="off"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Enter gene name..."
            variant="outlined"
            fullWidth
            autoFocus
            InputProps={{
              endAdornment: isFetching && <CircularProgress size={20} />,
              sx: { bgcolor: 'white' },
            }}
          />
        </div>

        <Popper
          ref={popoverRef}
          open={showResults}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          style={{ width: anchorRef.current?.offsetWidth }}
        >
          <Paper className="mt-1 max-h-[400px] overflow-y-auto !bg-accent-50 shadow-lg">
            {genes.length > 0 ? (
              <GeneResults genes={genes} />
            ) : (
              <div className="p-4 text-center text-gray-500">No genes found</div>
            )}
          </Paper>
        </Popper>
      </div>
    </ClickAwayListener>
  )
}

export default GeneSearch
