import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@/utils/test-utils'
import type { RootState } from '@/app/store/store'
import Toolbar from '@/app/layout/Toolbar'

describe('Toolbar Component', () => {
  const initialState: Partial<RootState> = {
    drawer: { leftDrawerOpen: false, rightDrawerOpen: false },
  }

  it('renders main elements', () => {
    renderWithProviders(
      <MemoryRouter>
        <Toolbar />
      </MemoryRouter>,
      { preloadedState: initialState }
    )

    expect(screen.getByText('PAN-GO')).toBeInTheDocument()
    expect(screen.getByText('Human Functionome')).toBeInTheDocument()
    expect(screen.getByText('Download')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
  })

  it('opens download menu on click', async () => {
    const { user } = renderWithProviders(
      <MemoryRouter>
        <Toolbar />
      </MemoryRouter>,
      { preloadedState: initialState }
    )

    await user.click(screen.getByText('Download'))
    expect(screen.getByText('All data as CSV')).toBeInTheDocument()
    expect(screen.getByText('All data as JSON')).toBeInTheDocument()
  })

  it('toggles left drawer on menu icon click', async () => {
    const { user, store } = renderWithProviders(
      <MemoryRouter>
        <Toolbar />
      </MemoryRouter>,
      { preloadedState: initialState }
    )

    expect(store.getState().drawer.leftDrawerOpen).toBe(false)
    await user.click(screen.getByLabelText(/open menu/i))
    expect(store.getState().drawer.leftDrawerOpen).toBe(true)
  })

  it('shows loading bar when showLoadingBar is true', () => {
    renderWithProviders(
      <MemoryRouter>
        <Toolbar showLoadingBar />
      </MemoryRouter>,
      { preloadedState: initialState }
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})
