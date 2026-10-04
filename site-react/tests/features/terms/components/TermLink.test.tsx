import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { buildTerm } from '@tests/fixtures/builders'
import type * as Analytics from '@/analytics'
import { handleGOTermLinkClick } from '@/analytics'
import { getConfig } from '@/@pango.core/data/constants'
import TermLink from '@/features/terms/components/TermLink'

vi.mock('@/analytics', async importOriginal => ({
  ...(await importOriginal<typeof Analytics>()),
  handleGOTermLinkClick: vi.fn(),
}))

const config = getConfig()

// jsdom cannot navigate, so link clicks have their default action cancelled; the app's own
// click handlers still run.
const cancelNavigation = (event: MouseEvent) => event.preventDefault()

describe('TermLink', () => {
  beforeEach(() => {
    document.addEventListener('click', cancelNavigation, true)
  })

  afterEach(() => {
    document.removeEventListener('click', cancelNavigation, true)
  })

  it('links a GO term to AmiGO in a new tab', () => {
    renderWithProviders(<TermLink term={buildTerm()} />)

    const link = screen.getByText('protein binding').closest('a')
    expect(link).toHaveAttribute('href', `${config.AMIGO_TERM_URL}GO:0005515`)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('records which GO term was opened', async () => {
    const { user } = renderWithProviders(<TermLink term={buildTerm()} />)

    await user.click(screen.getByText('protein binding'))

    expect(handleGOTermLinkClick).toHaveBeenCalledWith('GO:0005515')
  })

  it('shows a term without a GO id, such as an unknown aspect, as plain text', () => {
    renderWithProviders(
      <TermLink term={buildTerm({ id: 'UNKNOWN:0001', label: 'Unknown', displayId: '' })} />
    )

    expect(screen.getByText('Unknown').closest('a')).toBeNull()
  })
})
