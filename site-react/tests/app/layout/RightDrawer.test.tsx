import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { buildAnnotation } from '@tests/fixtures/builders'
import RightDrawerContent from '@/app/layout/RightDrawer'

const withSelection = {
  selectedAnnotation: { selectedAnnotation: buildAnnotation() },
  drawer: { leftDrawerOpen: false, rightDrawerOpen: true },
}

describe('RightDrawerContent', () => {
  it("shows the selected annotation's details", () => {
    renderWithProviders(<RightDrawerContent />, { preloadedState: withSelection })

    expect(screen.getByText('Selected Annotation')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Annotation Details' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'UniProtKB:P04637' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'protein binding' })).toBeInTheDocument()
  })

  it('shows only its header when nothing is selected', () => {
    renderWithProviders(<RightDrawerContent />)

    expect(screen.getByText('Selected Annotation')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Annotation Details' })).not.toBeInTheDocument()
  })

  it('closes and clears the selection from its Close button', async () => {
    const { user, store } = renderWithProviders(<RightDrawerContent />, {
      preloadedState: withSelection,
    })

    await user.click(screen.getByRole('button', { name: 'Close dialog' }))

    expect(store.getState().drawer.rightDrawerOpen).toBe(false)
    expect(store.getState().selectedAnnotation.selectedAnnotation).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Annotation Details' })).not.toBeInTheDocument()
  })
})
