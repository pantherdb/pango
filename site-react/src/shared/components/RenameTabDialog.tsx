import { useState, useEffect } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'

interface RenameTabDialogProps {
  open: boolean
  onClose: () => void
  currentName: string
  onRename: (newName: string) => void
}

const RenameTabDialog: React.FC<RenameTabDialogProps> = ({
  open,
  onClose,
  currentName,
  onRename,
}) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open) {
      setValue(currentName)
    }
  }, [open, currentName])

  const handleRename = () => {
    const trimmed = value.trim()
    if (trimmed) {
      document.title = trimmed
      onRename(trimmed)
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rename Browser Tab</DialogTitle>
      <DialogContent>
        <p className="mb-3 text-sm text-gray-500">
          Set a custom name for this browser tab to help distinguish it from other open PAN-GO tabs.
        </p>
        <TextField
          autoFocus
          fullWidth
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleRename()
          }}
          placeholder="Enter tab name..."
          size="small"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleRename} variant="contained">
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RenameTabDialog
