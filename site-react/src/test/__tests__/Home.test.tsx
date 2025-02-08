import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@/utils/test-utils'
import type { RootState } from '@/app/store/store'
import Home from '@/app/Home'

vi.mock('@/features/genes/slices/genesApiSlice', async () => {
  const originalModule = (await vi.importActual('@/features/genes/slices/genesApiSlice')) as object

  return {
    __esModule: true,
    ...originalModule,
    useGetGenesStatsQuery: vi.fn(() => ({
      data: {
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
      },
      isSuccess: true,
    })),
  }
})

describe('Home Component', () => {
  const initialState: Partial<RootState> = {
    search: {
      genes: [],
      slimTerms: [],
      filtersCount: 0,
      type: 'annotations',
      tooltips: {
        slimTerms: '',
        genes: '',
      },
      pagination: {
        page: 0,
        size: 0,
      },
    },
  }

  it('renders basic content', () => {
    renderWithProviders(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
      { preloadedState: initialState }
    )

    expect(screen.getByText('Functions of Human Genes')).toBeInTheDocument()
    expect(screen.getByText(/Read More/i)).toBeInTheDocument()
  })

  it('calls useGetGenesStatsQuery and updates the store', () => {
    const { store } = renderWithProviders(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
      { preloadedState: initialState }
    )

    const { terms } = store.getState()
    expect(terms.functionCategories).toHaveLength(1)
    expect(terms.functionCategories[0].label).toBe('Unknown molecular function')
  })
})
