import { describe, expect, it } from 'vitest'
import { getColor } from '@/@pango.core/data/colors'

describe('getColor', () => {
  it('looks up a material colour shade', () => {
    expect(getColor('lightBlue', 400)).toBe('#29b6f6')
    expect(getColor('red', 'A700')).toBe('#d50000')
  })

  it('returns null for an unknown colour or a shade the colour lacks', () => {
    expect(getColor('chartreuse', 500)).toBeNull()
    expect(getColor('grey', 'A100')).toBeNull()
  })
})
