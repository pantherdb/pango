import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as TermsApiSlice from '@/features/terms/slices/termsApiSlice'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { buildCategoryTerm } from '@tests/fixtures/builders'
import { queryResult } from '@tests/fixtures/mocks'
import { buildTermsState } from '@tests/fixtures/state'
import { AspectType } from '@/@pango.core/data/config'
import { useGetTermStatsQuery } from '@/features/terms/slices/termsApiSlice'
import CategoryStats from '@/shared/components/CategoryStats'

vi.mock('@/features/terms/slices/termsApiSlice', async importOriginal => ({
  ...(await importOriginal<typeof TermsApiSlice>()),
  useGetTermStatsQuery: vi.fn(),
}))

const catalytic = buildCategoryTerm({ id: 'GO:0003824', label: 'catalytic activity' })
const signaling = buildCategoryTerm({
  id: 'GO:0023052',
  label: 'signaling',
  aspect: AspectType.BIOLOGICAL_PROCESS,
})

const preloadedState = { terms: buildTermsState({ functionCategories: [catalytic, signaling] }) }

const termBucket = (id: string, label: string, docCount: number, parentIds: string[]) => ({
  key: label,
  docCount,
  meta: { id, label, displayId: id, aspect: AspectType.MOLECULAR_FUNCTION, parentIds },
})

const termStats = {
  termFrequency: {
    buckets: [
      termBucket('GO:0004672', 'protein kinase activity', 520, ['GO:0003824']),
      termBucket('GO:0016787', 'hydrolase activity', 410, ['GO:0003824']),
      termBucket('GO:0005216', 'ion channel activity', 300, ['GO:0005215']),
    ],
  },
}

describe('CategoryStats', () => {
  beforeEach(() => {
    vi.mocked(useGetTermStatsQuery).mockReturnValue(queryResult(undefined))
  })

  it('adds a category filter when a category is clicked', async () => {
    const { user, store } = renderWithProviders(<CategoryStats />, { preloadedState })

    await user.click(screen.getByText('catalytic activity'))

    expect(store.getState().search.slimTerms).toEqual([
      expect.objectContaining({ id: 'GO:0003824', label: 'catalytic activity' }),
    ])
  })

  it('hides the categories of an aspect when its checkbox is cleared', async () => {
    const { user } = renderWithProviders(<CategoryStats />, { preloadedState })

    await user.click(screen.getByRole('checkbox', { name: 'Biological Process' }))

    expect(screen.getByRole('checkbox', { name: 'Biological Process' })).not.toBeChecked()
    expect(screen.queryByText('signaling')).not.toBeInTheDocument()
    expect(screen.getByText('catalytic activity')).toBeInTheDocument()
  })

  it('expands a category from its labelled toggle without filtering by it', async () => {
    const { user, store } = renderWithProviders(<CategoryStats />, { preloadedState })
    const toggle = screen.getByRole('button', { name: 'Show terms in catalytic activity' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)

    expect(store.getState().terms.expandedCategoryId).toBe('GO:0003824')
    expect(store.getState().search.slimTerms).toEqual([])
    expect(
      screen.getByRole('button', { name: 'Hide terms in catalytic activity' })
    ).toHaveAttribute('aria-expanded', 'true')
  })

  it("lists the expanded category's directly annotated terms, and only those", async () => {
    vi.mocked(useGetTermStatsQuery).mockReturnValue(queryResult(termStats))
    const { user } = renderWithProviders(<CategoryStats />, { preloadedState })

    await user.click(screen.getByRole('button', { name: 'Show terms in catalytic activity' }))

    expect(screen.getByText('Directly annotated terms in this category (2)')).toBeInTheDocument()
    expect(screen.getByText('protein kinase activity')).toBeInTheDocument()
    expect(screen.getByText('410 genes')).toBeInTheDocument()
    expect(screen.queryByText('ion channel activity')).not.toBeInTheDocument()
    expect(vi.mocked(useGetTermStatsQuery)).toHaveBeenLastCalledWith(
      { filter: { geneIds: [], slimTermIds: ['GO:0003824'], termIds: [] } },
      { skip: false }
    )
  })

  it('adds a directly annotated term as a Terms filter when clicked', async () => {
    vi.mocked(useGetTermStatsQuery).mockReturnValue(queryResult(termStats))
    const { user, store } = renderWithProviders(<CategoryStats />, { preloadedState })
    await user.click(screen.getByRole('button', { name: 'Show terms in catalytic activity' }))

    await user.click(screen.getByText('hydrolase activity'))

    expect(store.getState().search.terms).toEqual([
      expect.objectContaining({ id: 'GO:0016787', label: 'hydrolase activity', count: 410 }),
    ])
    expect(store.getState().search.slimTerms).toEqual([])
  })

  it('closes the directly annotated terms from their collapse button', async () => {
    vi.mocked(useGetTermStatsQuery).mockReturnValue(queryResult(termStats))
    const { user, store } = renderWithProviders(<CategoryStats />, { preloadedState })
    await user.click(screen.getByRole('button', { name: 'Show terms in catalytic activity' }))

    await user.click(screen.getByRole('button', { name: 'Collapse child terms' }))

    expect(store.getState().terms.expandedCategoryId).toBeNull()
    expect(screen.queryByText('protein kinase activity')).not.toBeInTheDocument()
  })
})
