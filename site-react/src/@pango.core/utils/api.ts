import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

export interface ApiResponseError {
  message: string
}

export const handleErrors = (response: { errors?: ApiResponseError[] }): void => {
  if (response.errors) {
    const errorMessage = response.errors.map(error => error.message).join(', ')
    throw new Error(errorMessage)
  }
}

export const transformResponse = <T>(response: { data?: T; errors?: ApiResponseError[] }): T => {
  handleErrors(response)
  if (!response.data) {
    throw new Error('No data found')
  }

  return response.data as T
}

export const getErrorMessage = (error: FetchBaseQueryError | SerializedError): string => {
  if ('status' in error) {
    if ('data' in error && typeof error.data === 'object' && error.data !== null) {
      return (error.data as { message?: string }).message || 'Unknown server error'
    }
    return 'Server error'
  }
  return error.message || 'Unknown error'
}
