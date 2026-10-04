import { describe, expect, it } from 'vitest'
import { getErrorMessage, handleErrors, transformResponse } from '@/@pango.core/utils/api'

describe('API response helpers', () => {
  it('returns the data of a successful GraphQL response', () => {
    expect(transformResponse({ data: { genesCount: { total: 3 } } })).toEqual({
      genesCount: { total: 3 },
    })
  })

  it('throws the GraphQL error messages, joined', () => {
    const response = { data: {}, errors: [{ message: 'Bad filter' }, { message: 'Timeout' }] }

    expect(() => transformResponse(response)).toThrow('Bad filter, Timeout')
    expect(() => handleErrors(response)).toThrow('Bad filter, Timeout')
    expect(() => handleErrors({})).not.toThrow()
  })

  it('throws when a response carries no data', () => {
    expect(() => transformResponse({})).toThrow('No data found')
  })

  it('describes server errors by their message', () => {
    expect(getErrorMessage({ status: 500, data: { message: 'Index unavailable' } })).toBe(
      'Index unavailable'
    )
    expect(getErrorMessage({ status: 500, data: {} })).toBe('Unknown server error')
    expect(getErrorMessage({ status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' })).toBe(
      'Server error'
    )
  })

  it('describes client-side errors by their message', () => {
    expect(getErrorMessage({ message: 'Aborted' })).toBe('Aborted')
    expect(getErrorMessage({})).toBe('Unknown error')
  })
})
