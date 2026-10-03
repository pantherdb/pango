import { useState, useEffect } from 'react'
import { Button, Modal, TextInput } from '@mantine/core'

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
    <Modal opened={open} onClose={onClose} title="Rename Browser Tab" size="md" centered>
      <p className="mb-3 text-sm text-gray-500">
        Set a custom name for this browser tab to help distinguish it from other open PAN-GO tabs.
      </p>
      <TextInput
        autoFocus
        value={value}
        onChange={e => setValue(e.currentTarget.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleRename()
        }}
        placeholder="Enter tab name..."
        size="sm"
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="subtle" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="filled" onClick={handleRename}>
          Rename
        </Button>
      </div>
    </Modal>
  )
}

export default RenameTabDialog
