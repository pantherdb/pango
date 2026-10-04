import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { buildTerm } from '@tests/fixtures/builders'
import { mockMatchMedia } from '@tests/fixtures/mocks'
import { AspectType, EvidenceType } from '@/@pango.core/data/config'
import type { GroupedTerms } from '@/features/terms/models/term'
import GeneSummary from '@/features/genes/components/GeneSummary'

const groupedTerms = (overrides: Partial<GroupedTerms> = {}): GroupedTerms => ({
  mfs: [
    buildTerm(),
    buildTerm({
      id: 'GO:0019899',
      label: 'enzyme binding',
      displayId: 'GO:0019899',
      evidenceType: EvidenceType.HOMOLOGY,
    }),
  ],
  bps: [
    buildTerm({
      id: 'GO:0006915',
      label: 'apoptotic process',
      displayId: 'GO:0006915',
      aspect: AspectType.BIOLOGICAL_PROCESS,
    }),
  ],
  ccs: [],
  maxTerms: 150,
  expanded: false,
  ...overrides,
})

describe('GeneSummary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lays the terms out in one column per aspect on desktop', () => {
    renderWithProviders(<GeneSummary groupedTerms={groupedTerms()} />)

    expect(
      screen.getAllByRole('columnheader', { hidden: true }).map(header => header.textContent)
    ).toEqual(['Molecular Functions', 'Biological Processes', 'Cellular Components'])
    const [functions, processes, components] = screen.getAllByRole('cell', { hidden: true })
    expect(within(functions).getByText('protein binding')).toBeInTheDocument()
    expect(within(functions).getByText('enzyme binding')).toBeInTheDocument()
    expect(within(processes).getByText('apoptotic process')).toBeInTheDocument()
    expect(components).toBeEmptyDOMElement()
  })

  it('shows a collapsible section with a term count for each aspect on phones', async () => {
    mockMatchMedia(true)
    const { user } = renderWithProviders(<GeneSummary groupedTerms={groupedTerms()} />)

    const functions = screen.getByText('Molecular Function').closest('button') as HTMLElement
    expect(within(functions).getByText('2')).toBeInTheDocument()
    expect(screen.queryByText('Cellular Component')).not.toBeInTheDocument()
    expect(screen.getByText('protein binding')).toBeInTheDocument()

    await user.click(functions)
    expect(screen.queryByText('protein binding')).not.toBeInTheDocument()
    expect(screen.getByText('apoptotic process')).toBeInTheDocument()

    await user.click(functions)
    expect(screen.getByText('protein binding')).toBeInTheDocument()
  })

  it('shows every term after "View more" on desktop', async () => {
    const { user } = renderWithProviders(
      <GeneSummary groupedTerms={groupedTerms({ maxTerms: 1 })} />
    )
    expect(screen.queryByText('enzyme binding')).not.toBeInTheDocument()

    await user.click(screen.getByText(/View 1 more terms/))

    expect(screen.getByText('enzyme binding')).toBeInTheDocument()
    expect(screen.queryByText(/View \d+ more terms/)).not.toBeInTheDocument()
  })

  it('shows every term after "View more" on phones, keeping the section open', async () => {
    mockMatchMedia(true)
    const { user } = renderWithProviders(
      <GeneSummary groupedTerms={groupedTerms({ maxTerms: 1 })} />
    )

    await user.click(screen.getByText(/View 1 more terms/))

    expect(screen.getByText('protein binding')).toBeInTheDocument()
    expect(screen.getByText('enzyme binding')).toBeInTheDocument()
  })
})
