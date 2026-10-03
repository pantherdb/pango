import { useMediaQuery } from '@mantine/hooks'

/** Phone-width viewports: the site's single mobile breakpoint (MUI's old `sm`, 600px). */
export const MOBILE_MEDIA_QUERY = '(max-width: 599.99px)'

/**
 * True on phone-width viewports. The query is read during the first render (this is a client-only
 * SPA), so mobile layouts don't render the desktop version first and then switch.
 */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_MEDIA_QUERY, undefined, { getInitialValueInEffect: false })
}
