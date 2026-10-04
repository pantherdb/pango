import { beforeEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

describe('useDocumentTitle', () => {
  // Reset before (not after) each test: Testing Library unmounts the previous hook after our
  // afterEach hooks, and that unmount restores the title it saved.
  beforeEach(() => {
    document.title = ''
  })

  it('names the tab after the page and restores the previous title on unmount', () => {
    document.title = 'PAN-GO Results'

    const { unmount } = renderHook(() => useDocumentTitle('TP53'))
    expect(document.title).toBe('TP53 - PAN-GO')

    unmount()
    expect(document.title).toBe('PAN-GO Results')
  })

  it('follows the title as it changes', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'TP53' },
    })

    rerender({ title: 'BRCA1' })

    expect(document.title).toBe('BRCA1 - PAN-GO')
  })

  it('leaves the title alone until there is one to show', () => {
    document.title = 'PAN-GO Results'

    renderHook(() => useDocumentTitle(undefined))

    expect(document.title).toBe('PAN-GO Results')
  })

  it('falls back to the site title when there was none before', () => {
    const { unmount } = renderHook(() => useDocumentTitle('TP53'))

    unmount()

    expect(document.title).toBe('PAN-GO - Human Functionome')
  })
})
