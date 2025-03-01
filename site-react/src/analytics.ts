import ReactGA from 'react-ga4'

export const initGA = (measurementId: string) => {
  ReactGA.initialize(measurementId)
}

export const trackPageView = (path: string) => {
  ReactGA.send({ hitType: 'pageview', page: path })
}

export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  })
}

export const handleExternalLinkClick = (link: string) => {
  trackEvent('Navigate', 'External Link', link)
}

export const handleGOTermLinkClick = (id: string) => {
  trackEvent('Navigate', 'GO Term Link', id)
}
