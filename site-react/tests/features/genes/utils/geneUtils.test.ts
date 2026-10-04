import { describe, expect, it } from 'vitest'
import { calculateFontSize } from '@/features/genes/utils/geneUtils'

describe('calculateFontSize', () => {
  it('starts at 48px and shrinks as the text grows', () => {
    expect(calculateFontSize('')).toBe(48)
    expect(calculateFontSize('x'.repeat(50))).toBeCloseTo(31.2)
    expect(calculateFontSize('x'.repeat(25), 50)).toBeCloseTo(31.2)
  })

  it('never goes below 14px', () => {
    expect(calculateFontSize('x'.repeat(100))).toBeCloseTo(14.4)
    expect(calculateFontSize('x'.repeat(500))).toBe(14)
  })
})
