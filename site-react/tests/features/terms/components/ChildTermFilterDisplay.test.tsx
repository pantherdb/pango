import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { buildCategoryTerm } from '@tests/fixtures/builders'
import { buildSearchState } from '@tests/fixtures/state'
import ChildTermFilterDisplay from '@/features/terms/components/ChildTermFilterDisplay'

const childTerm = buildCategoryTerm({
  id: 'GO:0004672',
  label: 'protein kinase activity regulation',
  isGoSlim: false,
})

describe('ChildTermFilterDisplay', () => {
  it('renders nothing when no child term is selected', () => {
    renderWithProviders(<ChildTermFilterDisplay />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows a truncated pill that can be removed by keyboard', async () => {
    const { user, store } = renderWithProviders(<ChildTermFilterDisplay />, {
      preloadedState: { search: buildSearchState({ terms: [childTerm] }) },
    })

    expect(screen.getByText('protein kinase activ...')).toBeInTheDocument()

    await user.tab()
    const remove = screen.getByRole('button', { name: 'Remove protein kinase activity regulation' })
    expect(remove).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(store.getState().search.terms).toEqual([])
  })
})
