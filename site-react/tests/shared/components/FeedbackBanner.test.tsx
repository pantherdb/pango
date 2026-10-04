import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { getConfig } from '@/@pango.core/data/constants'
import { handleExternalLinkClick } from '@/analytics'
import FeedbackBanner from '@/shared/components/FeedbackBanner'

vi.mock('@/analytics', () => ({ handleExternalLinkClick: vi.fn() }))

const config = getConfig()

const reportLink = () => screen.getByText('Submit a quick report').closest('a')

describe('FeedbackBanner', () => {
  it('prefills the report form with the gene', () => {
    renderWithProviders(<FeedbackBanner geneSymbol="TP53" />)

    expect(reportLink()).toHaveAttribute(
      'href',
      `${config.CONTACT_PREFILL_URL}&entry.1624035027=TP53&entry.15683129=TP53&entry.168426483=TP53&entry.391072423=TP53`
    )
    expect(reportLink()).toHaveAttribute('target', '_blank')
  })

  it('links to the blank form when there is no gene', () => {
    renderWithProviders(<FeedbackBanner geneSymbol="" />)

    expect(reportLink()).toHaveAttribute('href', config.CONTACT_URL)
  })

  it('records the link that was actually opened', async () => {
    const { user } = renderWithProviders(<FeedbackBanner geneSymbol="TP53" />)
    // jsdom can't open the new tab; stop the click's default action after React has handled it.
    document.addEventListener('click', event => event.preventDefault(), { once: true })

    await user.click(screen.getByText('Submit a quick report'))

    expect(handleExternalLinkClick).toHaveBeenCalledWith(reportLink()?.getAttribute('href'))
  })
})
