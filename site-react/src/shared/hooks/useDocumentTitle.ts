import { useEffect, useRef } from 'react'

const DEFAULT_TITLE = 'PAN-GO - Human Functionome'

/**
 * Sets the browser tab title. Restores the default title on unmount.
 */
export function useDocumentTitle(title: string | undefined) {
  const prevTitle = useRef(document.title)

  useEffect(() => {
    const savedTitle = prevTitle.current
    if (title) {
      document.title = `${title} - PAN-GO`
    }
    return () => {
      document.title = savedTitle || DEFAULT_TITLE
    }
  }, [title])
}
