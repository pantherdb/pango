import apiService, { createGraphQLRequest } from '@/app/store/apiService'
import type { TermStats } from '../models/term'
import { GET_TERM_STATS_QUERY } from '@/features/genes/services/genesQueryService'

export const addTagTypes = ['term-stats'] as const

const termsApi = apiService
  .enhanceEndpoints({
    addTagTypes: ['term-stats'] as const,
  })
  .injectEndpoints({
    endpoints: builder => ({
      getTermStats: builder.query({
        query: ({ filter }) =>
          createGraphQLRequest(GET_TERM_STATS_QUERY, {
            filterArgs: {
              geneIds: filter?.geneIds,
              slimTermIds: filter?.slimTermIds,
            },
          }),
        transformResponse: (response: { data?: { termStats: TermStats } }) =>
          response.data?.termStats,
        providesTags: ['term-stats'],
      }),
    }),
    overrideExisting: false,
  })

export const { useGetTermStatsQuery } = termsApi
