import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as GenesApiSlice from '@/features/genes/slices/genesApiSlice'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { queryResult } from '@tests/fixtures/mocks'
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

describe('Home', () => {
  beforeEach(() => {
    vi.mocked(useGetGenesStatsQuery).mockReturnValue(queryResult(stats))
    vi.mocked(useGetGenesQuery).mockReturnValue(queryResult({ genes: [] }))
    vi.mocked(useGetGenesCountQuery).mockReturnValue(queryResult({ total: 0 }))
    vi.mocked(useGetAutocompleteQuery).mockReturnValue(queryResult(undefined))
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
})
