import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { Link, Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@tests/test-utils'
import { mockMatchMedia } from '@tests/fixtures/mocks'
import { initGA, trackPageView } from '@/analytics'
import Layout from '@/app/layout/Layout'

vi.mock('@/analytics')

const renderLayout = ({ leftOpen = true, rightOpen = false } = {}) =>
  renderWithProviders(
    <Routes>
      <Route
        path="/"
        element={
          <Layout
            leftDrawerContent={<p>filter panel</p>}
            rightDrawerContent={<button type="button">annotation details</button>}
          />
        }
      >
        <Route index element={<Link to="/?apiVersion=pango-1">next page</Link>} />
      </Route>
    </Routes>,
    { preloadedState: { drawer: { leftDrawerOpen: leftOpen, rightDrawerOpen: rightOpen } } }
  )

// The left panel's width is set inline from the store; the panel content sits two levels down.
const leftPanel = () => screen.getByText('filter panel').parentElement!.parentElement!

// Whole pages are slow to render and query in jsdom; allow for a loaded CI machine.
describe('Layout', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('wraps the current page in the toolbar, version banner and footer', () => {
    renderLayout()

    expect(screen.getByText('PAN-GO')).toBeInTheDocument()
    expect(screen.getByText('Previous version available')).toBeInTheDocument()
    expect(screen.getByText('next page')).toBeInTheDocument()
    expect(screen.getByText('Contact us')).toBeInTheDocument()
  })

  it('opens the filter panel to its full width and collapses it when closed', () => {
    const { unmount } = renderLayout({ leftOpen: true })
    expect(leftPanel()).toHaveStyle({ width: '420px' })
    unmount()

    renderLayout({ leftOpen: false })
    expect(leftPanel()).toHaveStyle({ width: '0px' })
  })

  it('gives the open filter panel the whole width on phones', () => {
    mockMatchMedia(true)
    renderLayout({ leftOpen: true })

    expect(leftPanel()).toHaveStyle({ width: '100%' })
  })

  it('shows the annotation drawer when the store opens it and closes it on Escape', async () => {
    const { user, store } = renderLayout({ rightOpen: true })
    expect(screen.getByRole('button', { name: 'annotation details' })).toBeVisible()

    await user.keyboard('{Escape}')

    expect(store.getState().drawer.rightDrawerOpen).toBe(false)
    expect(screen.queryByRole('button', { name: 'annotation details' })).not.toBeInTheDocument()
  })

  it('keeps the annotation drawer hidden while the store has it closed', () => {
    renderLayout({ rightOpen: false })

    expect(screen.queryByRole('button', { name: 'annotation details' })).not.toBeInTheDocument()
  })

  it('initialises analytics once and records every page view', async () => {
    const { user } = renderLayout()
    expect(initGA).toHaveBeenCalledExactlyOnceWith('G-245RCHN2PQ')
    expect(trackPageView).toHaveBeenLastCalledWith('/')

    await user.click(screen.getByRole('link', { name: 'next page' }))

    expect(trackPageView).toHaveBeenLastCalledWith('/?apiVersion=pango-1')
    expect(initGA).toHaveBeenCalledTimes(1)
    expect(screen.getByText('New version available!')).toBeInTheDocument()
  })
})
