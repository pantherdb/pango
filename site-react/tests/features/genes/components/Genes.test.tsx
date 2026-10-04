import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as GenesApiSlice from '@/features/genes/slices/genesApiSlice'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { buildGene, buildTerm } from '@tests/fixtures/builders'
import { mockMatchMedia, queryResult } from '@tests/fixtures/mocks'
import { buildSearchState } from '@tests/fixtures/state'
import { useGetGenesCountQuery, useGetGenesQuery } from '@/features/genes/slices/genesApiSlice'
import Genes from '@/features/genes/components/Genes'

vi.mock('@/features/genes/slices/genesApiSlice', async importOriginal => ({
  ...(await importOriginal<typeof GenesApiSlice>()),
  useGetGenesQuery: vi.fn(),
  useGetGenesCountQuery: vi.fn(),
}))

const threeFunctions = [
  buildTerm({ id: 'GO:0003700', displayId: 'GO:0003700', label: 'transcription factor activity' }),
  buildTerm({ id: 'GO:0005515', displayId: 'GO:0005515', label: 'protein binding' }),
  buildTerm({ id: 'GO:0019899', displayId: 'GO:0019899', label: 'enzyme binding' }),
]

const geneWithThreeFunctions = buildGene({
  groupedTerms: { mfs: threeFunctions, bps: [], ccs: [], maxTerms: 2, expanded: false },
})

describe('Genes', () => {
  beforeEach(() => {
    vi.mocked(useGetGenesQuery).mockReturnValue(queryResult({ genes: [buildGene()] }))
    vi.mocked(useGetGenesCountQuery).mockReturnValue(queryResult({ total: 45 }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lists the genes with links to their pages', () => {
    renderWithProviders(<Genes />)

    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'TP53' })).toHaveAttribute(
      'href',
      '/gene/UniProtKB:P04637'
    )
  })

  it('pages forward and back within the results', async () => {
    const { user, store } = renderWithProviders(<Genes />)
    const previous = screen.getByRole('button', { name: 'Previous page' })
    const next = screen.getByRole('button', { name: 'Next page' })

    expect(screen.getByText('1–20 of 45')).toBeInTheDocument()
    expect(previous).toBeDisabled()

    await user.click(next)
    await user.click(next)
    expect(store.getState().search.pagination.page).toBe(2)
    expect(screen.getByText('41–45 of 45')).toBeInTheDocument()
    expect(next).toBeDisabled()

    await user.click(previous)
    expect(store.getState().search.pagination.page).toBe(1)
  })

  it('changes the page size and goes back to the first page', async () => {
    const { user, store } = renderWithProviders(<Genes />, {
      preloadedState: { search: buildSearchState({ pagination: { page: 1, size: 20 } }) },
    })

    await user.click(screen.getByRole('combobox', { name: 'Rows per page' }))
    await user.click(screen.getByRole('option', { name: '50' }))

    expect(store.getState().search.pagination).toEqual({ page: 0, size: 50 })
  })

  it('shows a loading overlay instead of the results while the first page loads', () => {
    vi.mocked(useGetGenesQuery).mockReturnValue(
      queryResult(undefined, { isLoading: true, isSuccess: false })
    )
    renderWithProviders(<Genes />)

    expect(screen.getByRole('status', { name: 'Loading genes' })).toBeInTheDocument()
    expect(screen.queryByText(/Results/)).not.toBeInTheDocument()
  })

  it('says so when the genes cannot be loaded', () => {
    vi.mocked(useGetGenesQuery).mockReturnValue(
      queryResult(undefined, { isError: true, isSuccess: false, error: { status: 500 } })
    )
    renderWithProviders(<Genes />)

    expect(screen.getByText('Error loading genes')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows two functions per gene until the row is expanded', async () => {
    vi.mocked(useGetGenesQuery).mockReturnValue(queryResult({ genes: [geneWithThreeFunctions] }))
    const { user } = renderWithProviders(<Genes />)
    expect(screen.queryByText('enzyme binding')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /View 1 more terms/ }))

    expect(screen.getByText('enzyme binding')).toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: 'Collapse TP53 terms' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    await user.click(toggle)

    expect(screen.queryByText('enzyme binding')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand TP53 terms' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('lists gene cards instead of the table on phones', () => {
    mockMatchMedia(true)
    renderWithProviders(<Genes />)

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'TP53' })).toHaveAttribute(
      'href',
      '/gene/UniProtKB:P04637'
    )
    expect(screen.getByRole('button', { name: 'Molecular Function (0)' })).toBeInTheDocument()
  })

  it('offers "Open Filter" while the filter panel is closed', async () => {
    const { user, store } = renderWithProviders(<Genes />, {
      preloadedState: { drawer: { leftDrawerOpen: false, rightDrawerOpen: false } },
    })

    await user.click(screen.getByRole('button', { name: 'Open Filter' }))

    expect(store.getState().drawer.leftDrawerOpen).toBe(true)
    expect(screen.queryByRole('button', { name: 'Open Filter' })).not.toBeInTheDocument()
  })
})
