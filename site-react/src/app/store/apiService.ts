import type { BaseQueryFn } from '@reduxjs/toolkit/query/react'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { useSearchParams } from 'react-router-dom'
import { useCallback } from 'react'

export const ApiVersions = {
  V1: import.meta.env.VITE_PANGO_API_VERSION_1 || 'pango-1',
  V2: import.meta.env.VITE_PANGO_API_VERSION_2 || 'pango-2',
} as const

export type ApiVersion = typeof ApiVersions[keyof typeof ApiVersions]

const LATEST_VERSION = (import.meta.env.VITE_PANGO_API_VERSION as ApiVersion) || ApiVersions.V2
const VERSION_PARAM = 'apiVersion'

export const useApiVersion = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const currentVersion = (searchParams.get(VERSION_PARAM) as ApiVersion) || LATEST_VERSION

  const setVersion = useCallback(
    (version: ApiVersion) => {
      const newParams = new URLSearchParams(searchParams)
      if (version === LATEST_VERSION) {
        newParams.delete(VERSION_PARAM)
      } else {
        newParams.set(VERSION_PARAM, version)
      }
      setSearchParams(newParams)
    },
    [searchParams, setSearchParams]
  )

  return {
    currentVersion,
    setVersion,
    LATEST_VERSION,
  }
}

const baseQueryWithVersion: BaseQueryFn = async (args, api, extraOptions) => {
  const searchParams = new URLSearchParams(window.location.search)
  const version = (searchParams.get(VERSION_PARAM) as ApiVersion) || LATEST_VERSION

  const baseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_PANGO_API_URL,
    prepareHeaders: headers => {
      headers.set('Content-Type', 'application/json')
      headers.set('X-API-Version', version)
      return headers
    },
  })

  return baseQuery(args, api, extraOptions)
}

// Enhanced API service with version support
export const apiService = createApi({
  baseQuery: baseQueryWithVersion,
  endpoints: () => ({}),
  reducerPath: 'apiService',
})

// GraphQL specific utilities
export const createGraphQLRequest = (query: string, variables?: Record<string, any>) => ({
  url: 'graphql',
  method: 'POST',
  body: {
    query,
    variables,
  },
})

export default apiService
