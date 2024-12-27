import type { ApiResponseError } from '@/@pango.core/utils/api';
import { baseGraphQLRequest, createGraphQLBody, transformResponse } from '@/@pango.core/utils/api';
import type { GenesApiResponse } from './models/gene';
import { GET_GENES_QUERY } from './services/genesQueryService';
import apiService from '../store/apiService';
import { transformGenes } from './services/genesService';

export const addTagTypes = ['gene'] as const;

const GenesApi = apiService.enhanceEndpoints(
  { addTagTypes: addTagTypes }
).injectEndpoints({
  endpoints: (builder) => ({
    getGenes: builder.query({
      query: () => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_GENES_QUERY, { filter: { appType: 'self_care' } }),
      }),
      providesTags: (result, error, id) => [{ type: 'gene', id }],
      transformResponse: (response: { data?: GenesApiResponse; errors?: ApiResponseError[] }): GenesApiResponse => {
        const transformedResponse = transformResponse<GenesApiResponse>(response);
        return {
          ...transformedResponse,
          genes: transformGenes(transformedResponse.genes)
        };
      }
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetGenesQuery,
} = GenesApi;
