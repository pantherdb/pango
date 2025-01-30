import type { ApiResponseError } from '@/@pango.core/utils/api';
import { baseGraphQLRequest, createGraphQLBody, transformResponse } from '@/@pango.core/utils/api';
import apiService from '@/app/store/apiService';
import type { GenesApiResponse, GeneStats } from '../models/gene';
import { GET_GENES_QUERY, GET_GENES_COUNT_QUERY, GET_GENES_STATS_QUERY } from '../services/genesQueryService';
import { transformGenes } from '../services/genesService';
export const addTagTypes = ['gene', 'gene-stats'] as const;

const genesApi = apiService.enhanceEndpoints({
  addTagTypes: ['gene', 'gene-stats']
}).injectEndpoints({
  endpoints: (builder) => ({
    getGenes: builder.query({
      query: ({ page, size, filter }) => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_GENES_QUERY, {
          filterArgs: {
            geneIds: filter?.geneIds || [],
            slimTermIds: filter?.slimTermIds || []
          },
          pageArgs: {
            page,
            size
          }
        }),
      }),
      providesTags: ['gene'],
      transformResponse: (response: { data?: GenesApiResponse; errors?: ApiResponseError[] }): GenesApiResponse => {
        const transformedResponse = transformResponse<GenesApiResponse>(response);

        return {
          ...transformedResponse,
          genes: transformGenes(transformedResponse.genes)
        };
      }
    }),
    getGenesCount: builder.query({
      query: ({ filter }) => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_GENES_COUNT_QUERY, {
          filterArgs: {
            geneIds: filter?.geneIds,
            slimTermIds: filter?.slimTermIds
          }
        }),
      }),
      transformResponse: (response: { data?: { genesCount: { total: number } } }) =>
        response.data?.genesCount || { total: 0 },
      providesTags: ['gene']
    }),
    getGenesStats: builder.query({
      query: ({ filter }) => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_GENES_STATS_QUERY, {
          filterArgs: {
            geneIds: filter?.geneIds,
            slimTermIds: filter?.slimTermIds
          }
        }),
      }),
      transformResponse: (response: { data?: { geneStats: GeneStats } }) => response.data?.geneStats,
      providesTags: ['gene-stats']
    })
  }),
  overrideExisting: false,
});

export const {
  useGetGenesQuery,
  useGetGenesCountQuery,
  useGetGenesStatsQuery
} = genesApi;