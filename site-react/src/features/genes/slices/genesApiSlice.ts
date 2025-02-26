import type { ApiResponseError } from '@/@pango.core/utils/api'
import { transformResponse } from '@/@pango.core/utils/api'
import apiService, { createGraphQLRequest } from '@/app/store/apiService'
import type { AutocompleteType, GenesApiResponse, GeneStats } from '../models/gene'
import {
  GET_GENES_QUERY,
  GET_GENES_COUNT_QUERY,
  GET_GENES_STATS_QUERY,
  GET_AUTOCOMPLETE_QUERY,
} from '../services/genesQueryService'
import { transformGenes } from '../services/genesService'
export const addTagTypes = ['gene', 'gene-stats'] as const

const genesApi = apiService
  .enhanceEndpoints({
    addTagTypes: ['gene', 'gene-stats', 'autocomplete'] as const,
  })
  .injectEndpoints({
    endpoints: builder => ({
      getGenes: builder.query({
        query: ({ page, size, filter }) =>
          createGraphQLRequest(GET_GENES_QUERY, {
            filterArgs: {
              geneIds: filter?.geneIds || [],
              slimTermIds: filter?.slimTermIds || [],
            },
            pageArgs: {
              page,
              size,
            },
          }),
        providesTags: ['gene'],
        transformResponse: (response: {
          data?: GenesApiResponse
          errors?: ApiResponseError[]
        }): GenesApiResponse => {
          const transformedResponse = transformResponse<GenesApiResponse>(response)
          return {
            ...transformedResponse,
            genes: transformGenes(transformedResponse.genes),
          }
        },
      }),
      getGenesCount: builder.query({
        query: ({ filter }) =>
          createGraphQLRequest(GET_GENES_COUNT_QUERY, {
            filterArgs: {
              geneIds: filter?.geneIds,
              slimTermIds: filter?.slimTermIds,
            },
          }),
        transformResponse: (response: { data?: { genesCount: { total: number } } }) =>
          response.data?.genesCount || { total: 0 },
        providesTags: ['gene'],
      }),
      getGenesStats: builder.query({
        query: ({ filter }) =>
          createGraphQLRequest(GET_GENES_STATS_QUERY, {
            filterArgs: {
              geneIds: filter?.geneIds,
              slimTermIds: filter?.slimTermIds,
            },
          }),
        transformResponse: (response: { data?: { geneStats: GeneStats } }) =>
          response.data?.geneStats,
        providesTags: ['gene-stats'],
      }),

      getAutocomplete: builder.query({
        query: ({ type, keyword }: { type: AutocompleteType; keyword: string }) =>
          createGraphQLRequest(GET_AUTOCOMPLETE_QUERY, {
            autocompleteType: type,
            keyword,
            filterArgs: {
              geneIds: [],
              slimTermIds: [],
            },
          }),
        transformResponse: (response: {
          data?: { autocomplete: any }
          errors?: ApiResponseError[]
        }) => {
          const transformedResponse = transformResponse<{ autocomplete: any }>(
            response
          ).autocomplete
          return {
            ...transformedResponse,
            genes: transformGenes(transformedResponse),
          }
        },
        providesTags: ['autocomplete'],
      }),
    }),
    overrideExisting: false,
  })

export const {
  useGetGenesQuery,
  useGetGenesCountQuery,
  useGetGenesStatsQuery,
  useGetAutocompleteQuery,
} = genesApi
