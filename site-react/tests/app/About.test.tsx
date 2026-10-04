import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { BASE_CONFIG } from '@/@pango.core/data/constants'
import About from '@/app/About'

describe('About', () => {
  it('describes the current release', () => {
    renderWithProviders(<About />)

    expect(
      screen.getByRole('heading', { name: 'About the PAN-GO human gene functionome' })
    ).toBeInTheDocument()
    expect(screen.getByText('Version: 2.0')).toBeInTheDocument()
    expect(
      screen.getByText('GO annotations and ontology from GO release Oct 2025')
    ).toBeInTheDocument()
    expect(screen.getByText('Phylogenetic trees from PANTHER version 19.0')).toBeInTheDocument()
  })

  it('describes the PANGO 1 release when that API version is selected', () => {
    renderWithProviders(<About />, { route: '/about?apiVersion=pango-1' })

    expect(screen.getByText('Version: 1.0')).toBeInTheDocument()
    expect(screen.getByText('Phylogenetic trees from PANTHER version 15.0')).toBeInTheDocument()
  })

  it('links to the paper, the partners and the feedback form', () => {
    renderWithProviders(<About />)

    expect(screen.getByRole('link', { name: /Feuermann et al\./ })).toHaveAttribute(
      'href',
      BASE_CONFIG.PAPER_URL
    )
    expect(screen.getByRole('link', { name: 'Gene Ontology Consortium' })).toHaveAttribute(
      'href',
      'http://geneontology.org/'
    )
    expect(screen.getByRole('link', { name: 'suggest improvements' })).toHaveAttribute(
      'href',
      BASE_CONFIG.CONTACT_URL
    )
  })

  it('closes the filter panel to make room for the text', () => {
    const { store } = renderWithProviders(<About />, {
      preloadedState: { drawer: { leftDrawerOpen: true, rightDrawerOpen: false } },
    })

    expect(store.getState().drawer.leftDrawerOpen).toBe(false)
  })
})
