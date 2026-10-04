import { describe, expect, it } from 'vitest'
import { feedbackFormUrl } from '@/shared/utils/feedbackFormUrl'

const config = {
  CONTACT_URL: 'https://forms.example.test/contact',
  CONTACT_PREFILL_URL: 'https://forms.example.test/contact?usp=pp_url',
}

describe('feedbackFormUrl', () => {
  it('links the plain form when there is no gene', () => {
    expect(feedbackFormUrl(config)).toBe(config.CONTACT_URL)
    expect(feedbackFormUrl(config, '')).toBe(config.CONTACT_URL)
  })

  it('prefills every gene field of the form with the gene symbol', () => {
    const url = new URL(feedbackFormUrl(config, 'TP53'))

    expect(url.origin + url.pathname).toBe('https://forms.example.test/contact')
    expect(url.searchParams.get('usp')).toBe('pp_url')
    const geneFields = [...url.searchParams.entries()].filter(([key]) => key.startsWith('entry.'))
    expect(geneFields).toHaveLength(4)
    expect(new Set(geneFields.map(([, value]) => value))).toEqual(new Set(['TP53']))
  })

  it('URL-encodes the symbol', () => {
    expect(feedbackFormUrl(config, 'A&B')).toContain('=A%26B')
  })
})
