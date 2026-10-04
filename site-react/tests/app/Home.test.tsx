import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as GenesApiSlice from '@/features/genes/slices/genesApiSlice'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { mockMatchMedia, queryResult } from '@tests/fixtures/mocks'
import {
  useGetAutocompleteQuery,
  useGetGenesCountQuery,
  useGetGenesQuery,
  useGetGenesStatsQuery,
} from '@/features/genes/slices/genesApiSlice'
import Home from '@/app/Home'

vi.mock('@/features/genes/slices/genesApiSlice', async importOriginal => ({
  ...(await importOriginal<typeof GenesApiSlice>()),
  useGetGenesStatsQuery: vi.fn(),
  useGetGenesQuery: vi.fn(),
  useGetGenesCountQuery: vi.fn(),
  useGetAutocompleteQuery: vi.fn(),
}))

const stats = {
  slimTermFrequency: {
    buckets: [
      {
        docCount: 8734,
        key: 'Unknown molecular function',
        meta: {
          id: 'UNKNOWN:0001',
          aspect: 'molecular function',
          label: 'Unknown molecular function',
          displayId: '',
        },
      },
    ],
  },
}

const enrichmentToggle = 'Click to perform enrichment analysis...'

describe('Home', () => {
  beforeEach(() => {
    vi.mocked(useGetGenesStatsQuery).mockReturnValue(queryResult(stats))
    vi.mocked(useGetGenesQuery).mockReturnValue(queryResult({ genes: [] }))
    vi.mocked(useGetGenesCountQuery).mockReturnValue(queryResult({ total: 0 }))
    vi.mocked(useGetAutocompleteQuery).mockReturnValue(queryResult(undefined))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('introduces the functionome', () => {
    renderWithProviders(<Home />)

    expect(screen.getByText('Functions of Human Genes')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'read more' })).toHaveAttribute('href', '/about')
    expect(screen.getByText(/No Filters selected/)).toBeInTheDocument()
  })

  it('loads the function categories into the store', () => {
    const { store } = renderWithProviders(<Home />)

    const { functionCategories } = store.getState().terms
    expect(functionCategories).toHaveLength(1)
    expect(functionCategories[0].label).toBe('Unknown molecular function')
  })

  it('opens the filter panel on desktop', () => {
    const { store } = renderWithProviders(<Home />, {
      preloadedState: { drawer: { leftDrawerOpen: false, rightDrawerOpen: false } },
    })

    expect(store.getState().drawer.leftDrawerOpen).toBe(true)
  })

  it('keeps the filter panel closed on phones', () => {
    mockMatchMedia(true)
    const { store } = renderWithProviders(<Home />, {
      preloadedState: { drawer: { leftDrawerOpen: true, rightDrawerOpen: false } },
    })

    expect(store.getState().drawer.leftDrawerOpen).toBe(false)
  })

  it('opens and closes the enrichment form behind its prompt on phones', async () => {
    const { user } = renderWithProviders(<Home />)
    // The desktop copy of the form is always rendered (hidden on phones by CSS).
    expect(document.querySelectorAll('overrep-form')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: enrichmentToggle }))

    expect(document.querySelectorAll('overrep-form')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: enrichmentToggle })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close enrichment analysis' }))

    expect(screen.getByRole('button', { name: enrichmentToggle })).toBeInTheDocument()
    expect(document.querySelectorAll('overrep-form')).toHaveLength(1)
  })
})
