import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '@/utils/test-utils'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RootState } from '@/app/store/store'
import CategoryStats from '@/shared/components/CategoryStats'

describe('CategoryStats', () => {
  const initialState: Partial<RootState> = {
    terms: {
      functionCategories: [
        {
          id: 'cat1',
          aspect: 'molecular function',
          color: '#FF00FF',
          aspectShorthand: 'F',
          label: 'Unknown molecular function',
          width: '20%',
          countPos: '10%',
          count: 8734,
          displayId: 'GO:0000000',
          isGoSlim: false,
          evidenceType: 'experimental',
        },
      ],
    },
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

  it('renders categories and updates search.slimTerms on click', async () => {
    const { store } = renderWithProviders(<CategoryStats />, { preloadedState: initialState })

    // Verify category label is visible
    expect(screen.getByText('Unknown molecular function')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByText('Unknown molecular function'))

    const { slimTerms } = store.getState().search
    expect(slimTerms).toHaveLength(1)
    expect(slimTerms[0]).toMatchObject({
      id: 'cat1',
      label: 'Unknown molecular function',
    })
  })
})
