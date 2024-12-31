import type { ApiResponseError } from '@/@pango.core/utils/api';
import { baseGraphQLRequest, createGraphQLBody, transformResponse } from '@/@pango.core/utils/api';
import apiService from '../store/apiService';
import { GET_GENES_QUERY, GET_GENES_COUNT_QUERY, GET_GENES_STATS_QUERY } from './services/genesQueryService';
import type { GenesApiResponse } from './models/gene';
import { transformGenes } from './services/genesService';
import type { GeneStats } from '../annotations/models/annotation';

export const addTagTypes = ['gene', 'gene-stats'] as const;

const genesApi = apiService.enhanceEndpoints({
  addTagTypes: addTagTypes
}).injectEndpoints({
  endpoints: (builder) => ({
    getGenes: builder.query({
      query: () => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_GENES_QUERY, { filter: { appType: 'self_care' } }),
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
      query: () => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_GENES_COUNT_QUERY),
      }),
      transformResponse: (response: { data?: { genesCount: { total: number } } }) =>
        response.data?.genesCount || { total: 0 },
      providesTags: ['gene']
    }),

    getGenesStats: builder.query({
      query: () => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_GENES_STATS_QUERY),
      }),
      transformResponse: (response: { data?: { geneStats: GeneStats } }) =>
        response.data?.geneStats,
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