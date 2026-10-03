import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { mockMatchMedia } from '@tests/fixtures/mocks'
import { MOBILE_MEDIA_QUERY, useIsMobile } from '@/shared/hooks/useIsMobile'

describe('useIsMobile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('is true on phone-width viewports from the very first render', () => {
    const matchMedia = mockMatchMedia(true)
    const renders: boolean[] = []

    renderHook(() => renders.push(useIsMobile()))

    expect(renders[0]).toBe(true)
    expect(matchMedia).toHaveBeenCalledWith(MOBILE_MEDIA_QUERY)
  })

  it('is false on wider viewports', () => {
    mockMatchMedia(false)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })
})
