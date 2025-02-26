import type { ApiResponseError } from '@/@pango.core/utils/api'
import { transformResponse } from '@/@pango.core/utils/api'
import groupsData from '@/@pango.core/data//groups.json'
import apiService, { createGraphQLRequest } from '@/app/store/apiService'
import type {
  AnnotationsApiResponse,
  Group,
  AnnotationStats,
  AutocompleteType,
} from '../models/annotation'
import {
  GET_ANNOTATIONS_QUERY,
  GET_ANNOTATIONS_COUNT_QUERY,
  GET_ANNOTATION_STATS_QUERY,
  GET_SLIM_TERMS_AUTOCOMPLETE_QUERY,
} from '../services/annotationsQueryService'

export const addTagTypes = ['annotation', 'annotation-stats', 'autocomplete'] as const

const annotationsApi = apiService
  .enhanceEndpoints({
    addTagTypes: addTagTypes,
  })
  .injectEndpoints({
    endpoints: builder => ({
      getAnnotations: builder.query({
        query: ({ filterArgs, pageArgs }) =>
          createGraphQLRequest(GET_ANNOTATIONS_QUERY, {
            filterArgs: {
              geneIds: filterArgs?.geneIds || [],
            },
            pageArgs: {
              page: pageArgs?.page || 0,
              size: pageArgs?.size || 50,
            },
          }),
        providesTags: ['annotation'],
        transformResponse: (response: {
          data?: AnnotationsApiResponse
          errors?: ApiResponseError[]
        }): AnnotationsApiResponse => {
          const transformedResponse = transformResponse<AnnotationsApiResponse>(response)

          if (!transformedResponse?.annotations) {
            return transformedResponse
          }

          const annotationsWithDetails = transformedResponse.annotations.map(annotation => ({
            ...annotation,
            detailedGroups: annotation.groups.map(
              group => groupsData.find(g => g.shorthand === group) as Group
            ),
          }))

          return {
            ...transformedResponse,
            annotations: annotationsWithDetails,
          }
        },
      }),

      getAnnotationsCount: builder.query({
        query: () => createGraphQLRequest(GET_ANNOTATIONS_COUNT_QUERY),
        transformResponse: (response: {
          data?: { genesCount: { total: number } }
          errors?: ApiResponseError[]
        }) => {
          const transformedResponse = transformResponse<{
            genesCount: { total: number }
          }>(response)
          return transformedResponse.genesCount || { total: 0 }
        },
      }),

      getAnnotationStats: builder.query({
        query: ({ filterArgs }) =>
          createGraphQLRequest(GET_ANNOTATION_STATS_QUERY, {
            filterArgs: {
              geneIds: filterArgs?.geneIds || [],
            },
          }),
        transformResponse: (response: {
          data?: { annotationStats: AnnotationStats }
          errors?: ApiResponseError[]
        }) => {
          const transformedResponse = transformResponse<{
            annotationStats: AnnotationStats
          }>(response)
          return transformedResponse.annotationStats
        },
        providesTags: ['annotation-stats'],
      }),

      getSlimTermsAutocomplete: builder.query({
        query: ({ type, keyword }: { type: AutocompleteType; keyword: string }) =>
          createGraphQLRequest(GET_SLIM_TERMS_AUTOCOMPLETE_QUERY, {
            autocompleteType: type,
            keyword,
          }),
        transformResponse: (response: {
          data?: { slimTermsAutocomplete: any }
          errors?: ApiResponseError[]
        }) => {
          return transformResponse<{ slimTermsAutocomplete: any }>(response).slimTermsAutocomplete
        },
        providesTags: ['autocomplete'],
      }),
    }),
    overrideExisting: false,
  })

export const {
  useGetAnnotationsQuery,
  useGetAnnotationsCountQuery,
  useGetAnnotationStatsQuery,
  useGetSlimTermsAutocompleteQuery,
} = annotationsApi
