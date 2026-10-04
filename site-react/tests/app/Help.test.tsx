import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { BASE_CONFIG } from '@/@pango.core/data/constants'
import Help from '@/app/Help'

describe('Help', () => {
  it('walks through the home page and the gene page', () => {
    renderWithProviders(<Help />)

    expect(
      screen.getByRole('heading', { name: 'Tips for using the PAN-GO Functionome website' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'The home page has a header and two panels.' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'The gene page has multiple sections:' })
    ).toBeInTheDocument()
  })

  it('links to the enrichment analysis documentation', () => {
    renderWithProviders(<Help />)

    expect(screen.getByRole('link', { name: 'GO enrichment analysis' })).toHaveAttribute(
      'href',
      BASE_CONFIG.OVERREP_DOCS_API_URL
    )
  })
})
