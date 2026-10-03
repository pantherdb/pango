import { afterEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { VersionedButton } from '@/shared/components/VersionedButton'

describe('VersionedButton', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('links to an in-app route on the current API version', () => {
    window.history.replaceState({}, '', '/?apiVersion=pango-1')

    renderWithProviders(<VersionedButton to="/about">About</VersionedButton>)

    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about?apiVersion=pango-1'
    )
  })

  it('is a plain button without a destination', () => {
    renderWithProviders(<VersionedButton>Go</VersionedButton>)

    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
  })
})
