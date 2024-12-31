// annotationsApi.ts
import type { ApiResponseError } from '@/@pango.core/utils/api';
import { baseGraphQLRequest, createGraphQLBody, transformResponse } from '@/@pango.core/utils/api';
import apiService from '../store/apiService';
import {
  GET_ANNOTATIONS_QUERY,
  GET_ANNOTATIONS_COUNT_QUERY,
  GET_ANNOTATION_STATS_QUERY,
  GET_AUTOCOMPLETE_QUERY,
  GET_SLIM_TERMS_AUTOCOMPLETE_QUERY
} from './services/annotationsQueryService';
import type { FilterArgs, AnnotationStats, AutocompleteType } from './models/annotation';

export const addTagTypes = ['annotation', 'annotation-stats', 'autocomplete'] as const;

const annotationsApi = apiService.enhanceEndpoints({
  addTagTypes: addTagTypes
}).injectEndpoints({
  endpoints: (builder) => ({
    getAnnotations: builder.query({
      query: (filterArgs?: FilterArgs) => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_ANNOTATIONS_QUERY, {
          filter: { ...filterArgs, appType: 'self_care' }
        }),
      }),
      providesTags: (result, error, id) => [{ type: 'annotation', id }],
      transformResponse: (response: { data?: AnnotationsApiResponse; errors?: ApiResponseError[] }) =>
        transformResponse<AnnotationsApiResponse>(response)
    }),

    getAnnotationsCount: builder.query({
      query: (filterArgs?: FilterArgs) => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_ANNOTATIONS_COUNT_QUERY, { filterArgs }),
      }),
      transformResponse: (response: { data?: { genesCount: { total: number } } }) =>
        response.data?.genesCount || { total: 0 },
      providesTags: ['annotation']
    }),

    getAnnotationStats: builder.query({
      query: (filterArgs?: FilterArgs) => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_ANNOTATION_STATS_QUERY, { filterArgs }),
      }),
      transformResponse: (response: { data?: { geneStats: AnnotationStats } }) =>
        response.data?.geneStats,
      providesTags: ['annotation-stats']
    }),

    getAutocomplete: builder.query({
      query: ({ type, keyword, filterArgs }: {
        type: AutocompleteType,
        keyword: string,
        filterArgs?: FilterArgs
      }) => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_AUTOCOMPLETE_QUERY, {
          autocompleteType: type,
          keyword,
          filterArgs
        }),
      }),
      providesTags: ['autocomplete']
    }),

    getSlimTermsAutocomplete: builder.query({
      query: ({ keyword, filterArgs }: {
        keyword: string,
        filterArgs?: FilterArgs
      }) => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_SLIM_TERMS_AUTOCOMPLETE_QUERY, {
          keyword,
          filterArgs
        }),
      }),
      providesTags: ['autocomplete']
    })
  }),
  overrideExisting: false,
});

export const {
  useGetAnnotationsQuery,
  useGetAnnotationsCountQuery,
  useGetAnnotationStatsQuery,
  useGetAutocompleteQuery,
  useGetSlimTermsAutocompleteQuery
} = annotationsApi;