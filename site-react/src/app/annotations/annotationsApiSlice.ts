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
import type { AnnotationsApiResponse, AnnotationStats, AutocompleteType } from './models/annotation';

export const addTagTypes = ['annotation', 'annotation-stats', 'autocomplete'] as const;

const annotationsApi = apiService.enhanceEndpoints({
  addTagTypes: addTagTypes
}).injectEndpoints({
  endpoints: (builder) => ({
    getAnnotations: builder.query({
      query: () => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_ANNOTATIONS_QUERY, { filter: { appType: 'self_care' } }),
      }),
      providesTags: ['annotation'],
      transformResponse: (response: { data?: AnnotationsApiResponse; errors?: ApiResponseError[] }): AnnotationsApiResponse => {
        return transformResponse<AnnotationsApiResponse>(response);
      }
    }),

    getAnnotationsCount: builder.query({
      query: () => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_ANNOTATIONS_COUNT_QUERY),
      }),
      transformResponse: (response: { data?: { genesCount: { total: number } }; errors?: ApiResponseError[] }) => {
        const transformedResponse = transformResponse<{ genesCount: { total: number } }>(response);
        return transformedResponse.genesCount || { total: 0 };
      }
    }),

    getAnnotationStats: builder.query({
      query: () => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_ANNOTATION_STATS_QUERY),
      }),
      transformResponse: (response: { data?: { annotationStats: AnnotationStats }; errors?: ApiResponseError[] }) => {
        const transformedResponse = transformResponse<{ annotationStats: AnnotationStats }>(response);
        return transformedResponse.annotationStats;
      },
      providesTags: ['annotation-stats']
    }),

    getAutocomplete: builder.query({
      query: ({ type, keyword }: { type: AutocompleteType, keyword: string }) => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_AUTOCOMPLETE_QUERY, {
          autocompleteType: type,
          keyword,
          filterArgs: {
            geneIds: [],
            slimTermIds: []
          },
        }),
      }),
      transformResponse: (response: { data?: { autocomplete: any }; errors?: ApiResponseError[] }) => {
        return transformResponse<{ autocomplete: any }>(response).autocomplete;
      },
      providesTags: ['autocomplete']
    }),

    getSlimTermsAutocomplete: builder.query({
      query: ({ type, keyword }: { type: AutocompleteType, keyword: string }) => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_SLIM_TERMS_AUTOCOMPLETE_QUERY,
          {
            autocompleteType: type,
            keyword,
            filterArgs: {
              geneIds: [],
              slimTermIds: [],
              termIds: [],
              termTypeIds: [],
              evidenceTypeIds: [],
              aspectIds: [],
              withGeneIds: [],
              referenceIds: []
            },
          }),
      }),
      transformResponse: (response: { data?: { slimTermsAutocomplete: any }; errors?: ApiResponseError[] }) => {
        return transformResponse<{ slimTermsAutocomplete: any }>(response).slimTermsAutocomplete;
      },
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