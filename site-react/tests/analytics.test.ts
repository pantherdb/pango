import { describe, expect, it, vi } from 'vitest'
import ReactGA from 'react-ga4'
import {
  handleExternalLinkClick,
  handleGOTermLinkClick,
  initGA,
  trackEvent,
  trackPageView,
} from '@/analytics'

vi.mock('react-ga4', () => ({
  default: { initialize: vi.fn(), send: vi.fn(), event: vi.fn() },
}))

describe('analytics', () => {
  it('initialises Google Analytics with the measurement id', () => {
    initGA('G-TEST')

    expect(ReactGA.initialize).toHaveBeenCalledWith('G-TEST')
  })

  it('records page views by path', () => {
    trackPageView('/gene/UniProtKB:P04637?apiVersion=pango-1')

    expect(ReactGA.send).toHaveBeenCalledWith({
      hitType: 'pageview',
      page: '/gene/UniProtKB:P04637?apiVersion=pango-1',
    })
  })

  it('records events with their category, action, label and value', () => {
    trackEvent('Search', 'Gene Selection', 'UniProtKB:P04637', 3)

    expect(ReactGA.event).toHaveBeenCalledWith({
      category: 'Search',
      action: 'Gene Selection',
      label: 'UniProtKB:P04637',
      value: 3,
    })
  })

  it('records clicks on external and GO term links', () => {
    handleExternalLinkClick('https://www.uniprot.org/uniprotkb/P04637')
    handleGOTermLinkClick('GO:0005515')

    expect(ReactGA.event).toHaveBeenCalledWith({
      category: 'Navigate',
      action: 'External Link',
      label: 'https://www.uniprot.org/uniprotkb/P04637',
      value: undefined,
    })
    expect(ReactGA.event).toHaveBeenCalledWith({
      category: 'Navigate',
      action: 'GO Term Link',
      label: 'GO:0005515',
      value: undefined,
    })
  })
})
