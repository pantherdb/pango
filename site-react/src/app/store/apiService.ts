// src/services/apiVersionService.ts
import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

export enum ApiVersion {
	V2023 = 'pango-2023',
	V2024 = 'pango-2024',
}

const LATEST_VERSION = ApiVersion.V2023;
const VERSION_PARAM = 'apiVersion';

export const useApiVersion = () => {
	const [searchParams, setSearchParams] = useSearchParams();

	const currentVersion = searchParams.get(VERSION_PARAM) as ApiVersion || LATEST_VERSION;

	const setVersion = useCallback((version: ApiVersion) => {
		const newParams = new URLSearchParams(searchParams);
		if (version === LATEST_VERSION) {
			newParams.delete(VERSION_PARAM);
		} else {
			newParams.set(VERSION_PARAM, version);
		}
		setSearchParams(newParams);
	}, [searchParams, setSearchParams]);

	return {
		currentVersion,
		setVersion,
		LATEST_VERSION
	};
};

// Custom base query with version header
const baseQueryWithVersion: BaseQueryFn = async (args, api, extraOptions) => {
	const searchParams = new URLSearchParams(window.location.search);
	const version = searchParams.get(VERSION_PARAM) as ApiVersion || LATEST_VERSION;

	const baseQuery = fetchBaseQuery({
		baseUrl: import.meta.env.VITE_PANGO_API_URL,
		prepareHeaders: (headers) => {
			headers.set('Content-Type', 'application/json');
			headers.set('X-API-Version', version);
			return headers;
		},
	});

	return baseQuery(args, api, extraOptions);
};

// Enhanced API service with version support
export const apiService = createApi({
	baseQuery: baseQueryWithVersion,
	endpoints: () => ({}),
	reducerPath: 'apiService'
});

// GraphQL specific utilities
export const createVersionedGraphQLRequest = (
	query: string,
	variables?: Record<string, any>
) => ({
	url: 'graphql',
	method: 'POST',
	body: {
		query,
		variables
	}
});

export default apiService;