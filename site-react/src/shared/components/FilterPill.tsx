import type { PillProps } from '@mantine/core'
import { Pill } from '@mantine/core'

type FilterPillProps = Omit<PillProps, 'withRemoveButton' | 'onRemove' | 'removeButtonProps'> & {
  /** Accessible name of the remove button, e.g. "Remove Genes filters". */
  removeLabel: string
  onRemove: () => void
}

/**
 * A removable filter pill. Mantine hides a pill's remove button from the keyboard and screen readers
 * (PillsInput expects Backspace instead); here it is a real, labelled button so every filter can be
 * removed without a mouse.
 */
export const FilterPill = ({ removeLabel, onRemove, ...props }: FilterPillProps) => (
  <Pill
    withRemoveButton
    onRemove={onRemove}
    removeButtonProps={{ tabIndex: 0, 'aria-hidden': false, 'aria-label': removeLabel }}
    {...props}
  />
)
