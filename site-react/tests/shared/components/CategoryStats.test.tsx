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
})
