import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiService = createApi({
	baseQuery: fetchBaseQuery({
		baseUrl: import.meta.env.VITE_PANGO_API_URL,
		prepareHeaders: async (headers) => {

			return headers;
		}
	}),
	endpoints: () => ({}),
	reducerPath: 'apiService'
});

export default apiService;