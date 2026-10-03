import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { buildCategoryTerm, buildGene } from '@tests/fixtures/builders'
import { buildSearchState } from '@tests/fixtures/state'
import FilterSummary from '@/features/search/components/FilterSummary'

const genes = [
  buildGene(),
  buildGene({ gene: 'UniProtKB:P38398', geneSymbol: 'BRCA1', geneName: 'Breast cancer type 1' }),
]

describe('FilterSummary', () => {
  it('explains that nothing is filtered yet', () => {
    renderWithProviders(<FilterSummary />)

    expect(screen.getByText(/No Filters selected/)).toBeInTheDocument()
  })

  it('counts the selected filters in each group', () => {
    renderWithProviders(<FilterSummary />, {
      preloadedState: { search: buildSearchState({ genes, slimTerms: [buildCategoryTerm()] }) },
    })

    expect(screen.getByText('Genes (2)')).toBeInTheDocument()
    expect(screen.getByText('Function Categories (1)')).toBeInTheDocument()
    expect(screen.queryByText(/^Terms/)).not.toBeInTheDocument()
  })

  it('clears every filter from a keyboard-reachable button', async () => {
    const { user, store } = renderWithProviders(<FilterSummary />, {
      preloadedState: { search: buildSearchState({ genes }) },
    })

    await user.tab()
    expect(screen.getByRole('button', { name: 'Clear All Filters' })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(store.getState().search.filtersCount).toBe(0)
  })

  it('removes one whole group from its pill', async () => {
    const { user, store } = renderWithProviders(<FilterSummary />, {
      preloadedState: { search: buildSearchState({ genes, slimTerms: [buildCategoryTerm()] }) },
    })

    await user.click(screen.getByRole('button', { name: 'Remove genes filters' }))

    expect(store.getState().search.genes).toEqual([])
    expect(store.getState().search.slimTerms).toHaveLength(1)
  })
})
