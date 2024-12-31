// genesApi.ts
import { baseGraphQLRequest, createGraphQLBody } from '@/@pango.core/utils/api';
import apiService from '../store/apiService';
import {
  GET_GENES_QUERY,
  GET_GENES_COUNT_QUERY,
  GET_GENES_STATS_QUERY
} from './services/genesQueryService';
import { transformGenes } from './services/genesService';
import type { GeneFilterArgs, GeneStats } from './models/gene';

export const addTagTypes = ['gene', 'gene-stats'] as const;

const genesApi = apiService.enhanceEndpoints({
  addTagTypes: addTagTypes
}).injectEndpoints({
  endpoints: (builder) => ({
    getGenes: builder.query({
      query: (filterArgs?: GeneFilterArgs) => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_GENES_QUERY, {
          filter: { ...filterArgs, appType: 'self_care' }
        }),
      }),
      providesTags: (result, error, id) =>
        result ? result.map(gene => ({ type: 'gene', id: gene.id })) : [{ type: 'gene', id }],

      transformResponse: transformGenes
    }),

    getGenesCount: builder.query({
      query: (filterArgs?: GeneFilterArgs) => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_GENES_COUNT_QUERY, { filterArgs }),
      }),
      transformResponse: (response: { data?: { genesCount: { total: number } } }) =>
        response.data?.genesCount || { total: 0 },
      providesTags: ['gene']
    }),

    getGenesStats: builder.query({
      query: (filterArgs?: GeneFilterArgs) => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_GENES_STATS_QUERY, { filterArgs }),
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
