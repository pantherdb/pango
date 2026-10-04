import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { buildCategoryTerm, buildGene } from '@tests/fixtures/builders'
import { mockMatchMedia, queryResult } from '@tests/fixtures/mocks'
import { buildSearchState } from '@tests/fixtures/state'
import type * as TermsApiSlice from '@/features/terms/slices/termsApiSlice'
import { useGetTermStatsQuery } from '@/features/terms/slices/termsApiSlice'
import LeftDrawerContent from '@/app/layout/LeftDrawer'

vi.mock('@/features/terms/slices/termsApiSlice', async importOriginal => ({
  ...(await importOriginal<typeof TermsApiSlice>()),
  useGetTermStatsQuery: vi.fn(),
}))

const openDrawer = { leftDrawerOpen: true, rightDrawerOpen: false }

describe('LeftDrawerContent', () => {
  beforeEach(() => {
    vi.mocked(useGetTermStatsQuery).mockReturnValue(queryResult(undefined))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('holds the category graph and filter under its title', () => {
    renderWithProviders(<LeftDrawerContent />)

    expect(screen.getByText('Interactive Graph and Filter')).toBeInTheDocument()
    expect(screen.getByText('Distribution of Genes by Function Category')).toBeInTheDocument()
  })

  it('offers Clear Filters only while filters are set', () => {
    renderWithProviders(<LeftDrawerContent />)

    expect(screen.queryByRole('button', { name: 'Clear Filters' })).not.toBeInTheDocument()
  })

  it('clears every filter from Clear Filters', async () => {
    const { user, store } = renderWithProviders(<LeftDrawerContent />, {
      preloadedState: {
        search: buildSearchState({ genes: [buildGene()], slimTerms: [buildCategoryTerm()] }),
      },
    })

    await user.click(screen.getByRole('button', { name: 'Clear Filters' }))

    expect(store.getState().search.filtersCount).toBe(0)
    expect(screen.queryByRole('button', { name: 'Clear Filters' })).not.toBeInTheDocument()
  })

  it('hides the panel from its Close button', async () => {
    const { user, store } = renderWithProviders(<LeftDrawerContent />, {
      preloadedState: { drawer: openDrawer },
    })

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(store.getState().drawer.leftDrawerOpen).toBe(false)
  })

  it('labels that button "View Results" on phones', async () => {
    mockMatchMedia(true)
    const { user, store } = renderWithProviders(<LeftDrawerContent />, {
      preloadedState: { drawer: openDrawer },
    })

    await user.click(screen.getByRole('button', { name: 'View Results' }))

    expect(store.getState().drawer.leftDrawerOpen).toBe(false)
  })
})
