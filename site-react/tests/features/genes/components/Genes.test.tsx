import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as GenesApiSlice from '@/features/genes/slices/genesApiSlice'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { buildGene } from '@tests/fixtures/builders'
import { queryResult } from '@tests/fixtures/mocks'
import { buildSearchState } from '@tests/fixtures/state'
import { useGetGenesCountQuery, useGetGenesQuery } from '@/features/genes/slices/genesApiSlice'
import Genes from '@/features/genes/components/Genes'

vi.mock('@/features/genes/slices/genesApiSlice', async importOriginal => ({
  ...(await importOriginal<typeof GenesApiSlice>()),
  useGetGenesQuery: vi.fn(),
  useGetGenesCountQuery: vi.fn(),
}))

describe('Genes', () => {
  beforeEach(() => {
    vi.mocked(useGetGenesQuery).mockReturnValue(queryResult({ genes: [buildGene()] }))
    vi.mocked(useGetGenesCountQuery).mockReturnValue(queryResult({ total: 45 }))
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
})
