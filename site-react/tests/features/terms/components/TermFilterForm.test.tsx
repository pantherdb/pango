import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { buildCategoryTerm } from '@tests/fixtures/builders'
import { buildSearchState, buildTermsState } from '@tests/fixtures/state'
import { AspectType } from '@/@pango.core/data/config'
import TermFilterForm from '@/features/terms/components/TermFilterForm'

const catalytic = buildCategoryTerm({ id: 'GO:0003824', label: 'catalytic activity' })
const transporter = buildCategoryTerm({ id: 'GO:0005215', label: 'transporter activity' })
const signaling = buildCategoryTerm({
  id: 'GO:0023052',
  label: 'signaling',
  aspect: AspectType.BIOLOGICAL_PROCESS,
})

const terms = buildTermsState({ functionCategories: [catalytic, transporter, signaling] })

describe('TermFilterForm', () => {
  it('suggests the categories that match and adds the chosen one', async () => {
    const { user, store } = renderWithProviders(<TermFilterForm />, { preloadedState: { terms } })

    await user.type(screen.getByPlaceholderText('Type to Search...'), 'activ')
    expect(screen.getByText('catalytic activity')).toBeInTheDocument()
    expect(screen.queryByText('signaling')).not.toBeInTheDocument()

    await user.click(screen.getByText('transporter activity'))

    expect(store.getState().search.slimTerms.map(term => term.id)).toEqual(['GO:0005215'])
  })

  it('does not suggest categories that are already selected', async () => {
    const { user } = renderWithProviders(<TermFilterForm />, {
      preloadedState: { terms, search: buildSearchState({ slimTerms: [catalytic] }) },
    })

    await user.type(screen.getByPlaceholderText('Type to Search...'), 'activ')

    expect(screen.getAllByText(/catalytic activity/)).toHaveLength(1) // the selected pill only
    expect(screen.getByText('transporter activity')).toBeInTheDocument()
  })

  it('removes the last category with Backspace in an empty field', async () => {
    const { user, store } = renderWithProviders(<TermFilterForm />, {
      preloadedState: { terms, search: buildSearchState({ slimTerms: [catalytic, transporter] }) },
    })

    await user.click(screen.getByPlaceholderText('Type to Search...'))
    await user.keyboard('{Backspace}')

    expect(store.getState().search.slimTerms.map(term => term.id)).toEqual(['GO:0003824'])
  })

  it('stops adding at the limit but keeps selected categories removable', async () => {
    const { user, store } = renderWithProviders(<TermFilterForm maxTerms={1} />, {
      preloadedState: { terms, search: buildSearchState({ slimTerms: [catalytic] }) },
    })

    expect(screen.getByPlaceholderText('Max 1 categories selected')).toBeDisabled()
    expect(
      screen.getByText('catalytic activity').closest('.mantine-Pill-root')
    ).not.toHaveAttribute('data-disabled')
    await user.click(screen.getByRole('button', { name: 'Remove catalytic activity' }))

    expect(store.getState().search.slimTerms).toEqual([])
  })
})
