import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import VersionBanner from '@/app/layout/VersionBanner'

describe('VersionBanner', () => {
  it('points the current version (PANGO 2) back to PANGO 1', () => {
    renderWithProviders(<VersionBanner />)

    expect(screen.getByText('Previous version available')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Switch to PANGO 1.0' })).toHaveAttribute(
      'href',
      'https://functionome.geneontology.org/?apiVersion=pango-1'
    )
  })

  it('points PANGO 1 visitors to the new version', () => {
    renderWithProviders(<VersionBanner />, { route: '/?apiVersion=pango-1' })

    expect(screen.getByText('New version available!')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Try PANGO 2.0' })).toHaveAttribute(
      'href',
      'https://functionome.geneontology.org'
    )
  })

  it('treats an unknown API version as the latest one', () => {
    renderWithProviders(<VersionBanner />, { route: '/?apiVersion=pango-9' })

    expect(screen.getByText('Previous version available')).toBeInTheDocument()
  })
})
