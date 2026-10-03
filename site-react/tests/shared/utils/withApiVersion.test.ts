import { describe, expect, it } from 'vitest'
import { withApiVersion } from '@/shared/utils/withApiVersion'

describe('withApiVersion', () => {
  it('leaves the url alone when no API version is selected', () => {
    expect(withApiVersion('/about', '')).toBe('/about')
  })

  it('carries the selected API version over', () => {
    expect(withApiVersion('/about', '?apiVersion=pango-1')).toBe('/about?apiVersion=pango-1')
  })

  it('extends an existing query string', () => {
    expect(withApiVersion('/help?section=faq', '?apiVersion=pango-1')).toBe(
      '/help?section=faq&apiVersion=pango-1'
    )
  })

  it('encodes the version', () => {
    expect(withApiVersion('/', '?apiVersion=a%26b')).toBe('/?apiVersion=a%26b')
  })
})
