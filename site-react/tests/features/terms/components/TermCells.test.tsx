import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { buildTerm } from '@tests/fixtures/builders'
import { AspectType } from '@/@pango.core/data/config'
import type { GroupedTerms } from '@/features/terms/models/term'
import TermCells from '@/features/terms/components/TermCells'

const groupedTerms: GroupedTerms = {
  mfs: [
    buildTerm(),
    buildTerm({ id: 'GO:0019899', label: 'enzyme binding', displayId: 'GO:0019899' }),
  ],
  bps: [
    buildTerm({
      id: 'GO:0006915',
      label: 'apoptotic process',
      displayId: 'GO:0006915',
      aspect: AspectType.BIOLOGICAL_PROCESS,
    }),
  ],
  ccs: [
    buildTerm({
      id: 'GO:0005634',
      label: 'nucleus',
      displayId: 'GO:0005634',
      aspect: AspectType.CELLULAR_COMPONENT,
    }),
  ],
  maxTerms: 1,
  expanded: false,
}

// Table cells need a row to live in.
const renderCells = (onToggleExpand: () => void) =>
  renderWithProviders(
    <table>
      <tbody>
        <tr>
          <TermCells groupedTerms={groupedTerms} onToggleExpand={onToggleExpand} />
        </tr>
      </tbody>
    </table>
  )

describe('TermCells', () => {
  it('puts function, process and component terms in their own cells, in that order', () => {
    renderCells(vi.fn())

    const [functions, processes, components] = screen.getAllByRole('cell', { hidden: true })
    expect(within(functions).getByText('protein binding')).toBeInTheDocument()
    expect(within(processes).getByText('apoptotic process')).toBeInTheDocument()
    expect(within(components).getByText('nucleus')).toBeInTheDocument()
  })

  it('caps each cell at maxTerms and asks to expand when there are more', async () => {
    const onToggleExpand = vi.fn()
    const { user } = renderCells(onToggleExpand)

    const [functions, processes] = screen.getAllByRole('cell', { hidden: true })
    expect(within(functions).queryByText('enzyme binding')).not.toBeInTheDocument()
    expect(within(processes).queryByText(/more terms/)).not.toBeInTheDocument()

    await user.click(within(functions).getByText('— View 1 more terms'))

    expect(onToggleExpand).toHaveBeenCalledTimes(1)
  })
})
