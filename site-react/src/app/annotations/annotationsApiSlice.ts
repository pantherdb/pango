import type { ApiResponseError } from '@/@pango.core/utils/api';
import { baseGraphQLRequest, createGraphQLBody, transformResponse } from '@/@pango.core/utils/api';
import type { AnnotationsApiResponse } from './models/annotation';
import { GET_ANNOTATIONS_QUERY } from './services/annotationsQueryService';
import apiService from '../store/apiService';

export const addTagTypes = ['annotation'] as const;

const AnnotationsApi = apiService.enhanceEndpoints(
  { addTagTypes: addTagTypes }
).injectEndpoints({
  endpoints: (builder) => ({
    getAnnotations: builder.query({
      query: () => ({
        ...baseGraphQLRequest,
        body: createGraphQLBody(GET_ANNOTATIONS_QUERY, { filter: { appType: 'self_care' } }),
      }),
      providesTags: (result, error, id) => [{ type: 'annotation', id }],
      transformResponse: (response: { data?: AnnotationsApiResponse; errors?: ApiResponseError[] }): AnnotationsApiResponse => {
        return transformResponse<AnnotationsApiResponse>(response);
      },
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetAnnotationsQuery,
} = AnnotationsApi;
