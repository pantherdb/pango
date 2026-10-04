import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { BASE_CONFIG } from '@/@pango.core/data/constants'
import Footer from '@/app/layout/Footer'

describe('Footer', () => {
  it('links home and to the contact form', () => {
    renderWithProviders(<Footer />)

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    const contact = screen.getByRole('link', { name: 'Contact us' })
    expect(contact).toHaveAttribute('href', BASE_CONFIG.CONTACT_URL)
    expect(contact).toHaveAttribute('target', '_blank')
  })

  it("credits the funding with this year's copyright", () => {
    renderWithProviders(<Footer />)

    expect(
      screen.getByText(new RegExp(`Copyright © ${new Date().getFullYear()} The Gene Ontology`))
    ).toBeInTheDocument()
  })
})
