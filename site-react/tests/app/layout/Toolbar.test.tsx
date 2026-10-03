import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { mockMatchMedia, queryResult } from '@tests/fixtures/mocks'
import type * as GenesApiSlice from '@/features/genes/slices/genesApiSlice'
import { useGetAutocompleteQuery } from '@/features/genes/slices/genesApiSlice'
import Toolbar from '@/app/layout/Toolbar'

vi.mock('@/features/genes/slices/genesApiSlice', async importOriginal => ({
  ...(await importOriginal<typeof GenesApiSlice>()),
  useGetAutocompleteQuery: vi.fn(),
}))

const preloadedState = { drawer: { leftDrawerOpen: false, rightDrawerOpen: false } }

const searchField = () => screen.queryByPlaceholderText('Enter gene name...')
const searchTrigger = () => screen.getByRole('button', { name: 'Search genes' })

describe('Toolbar', () => {
  beforeEach(() => {
    vi.mocked(useGetAutocompleteQuery).mockReturnValue(queryResult(undefined))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.history.replaceState({}, '', '/')
  })

  it('renders the brand and the desktop navigation', () => {
    renderWithProviders(<Toolbar />, { preloadedState })

    expect(screen.getByText('PAN-GO')).toBeInTheDocument()
    expect(screen.getByText('Human Functionome')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute('href', '/help')
  })

  it('lists the downloads in a menu', async () => {
    const { user } = renderWithProviders(<Toolbar />, { preloadedState })

    await user.click(screen.getByRole('button', { name: 'Download' }))

    expect(screen.getByRole('menuitem', { name: 'All data as CSV' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Ontology Files' })).toHaveAttribute(
      'target',
      '_blank'
    )
  })

  it('toggles the filter panel', async () => {
    const { user, store } = renderWithProviders(<Toolbar />, { preloadedState })

    await user.click(screen.getByRole('button', { name: 'Toggle filter panel' }))

    expect(store.getState().drawer.leftDrawerOpen).toBe(true)
  })

  it('shows a loading bar when asked to', () => {
    renderWithProviders(<Toolbar showLoadingBar />, { preloadedState })

    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument()
  })

  it('lets keyboard users tab past the search button to the rest of the toolbar', async () => {
    const { user } = renderWithProviders(<Toolbar />, { preloadedState })
    act(() => searchTrigger().focus())

    await user.tab()

    expect(screen.getByRole('link', { name: 'PAN-GO on GitHub' })).toHaveFocus()
    expect(searchField()).not.toBeInTheDocument()
  })

  it('opens the gene search from the keyboard and hands focus back on Escape', async () => {
    const { user } = renderWithProviders(<Toolbar />, { preloadedState })
    act(() => searchTrigger().focus())

    await user.keyboard('{Enter}')
    expect(searchField()).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(searchField()).not.toBeInTheDocument()
    expect(searchTrigger()).toHaveFocus()
  })

  it('closes from its close button without the press counting as one outside', async () => {
    const { user } = renderWithProviders(<Toolbar />, { preloadedState })
    await user.click(searchTrigger())
    const close = screen.getByRole('button', { name: 'Close search' })

    // On touch screens a press that closed the search early would let the tap land on whatever
    // replaced the close button.
    fireEvent.touchStart(close)
    expect(searchField()).toBeInTheDocument()

    await user.click(close)
    expect(searchField()).not.toBeInTheDocument()
    expect(searchTrigger()).toHaveFocus()
  })

  it('closes on a press outside the search row, leaving focus where the user pressed', async () => {
    const { user } = renderWithProviders(
      <>
        <Toolbar />
        <button type="button">page content</button>
      </>,
      { preloadedState }
    )
    await user.click(searchTrigger())
    await user.type(screen.getByPlaceholderText('Enter gene name...'), 'tp')

    await user.click(screen.getByText('Search Genes'))
    expect(searchField()).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'page content' }))
    expect(searchField()).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'page content' })).toHaveFocus()
  })

  it('names every icon-only button on mobile and keeps the API version in its links', () => {
    mockMatchMedia(true)
    window.history.replaceState({}, '', '/?apiVersion=pango-1')
    renderWithProviders(<Toolbar />, { preloadedState })

    expect(screen.getByRole('button', { name: 'Search genes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Downloads' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'PAN-GO on GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about?apiVersion=pango-1'
    )
    expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '/help?apiVersion=pango-1'
    )
  })
})
