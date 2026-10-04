import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { parseBuild, parseRun } from '@/features/builds/model/parse'
import type {
  BuildRecord,
  BuildResponse,
  BuildsResponse,
  EventsResponse,
  LiveBuildResponse,
  LiveEnvironmentsResponse,
  LiveTargetsResponse,
  RunRecord,
  RunResponse,
} from '@/features/builds/model/types'

/**
 * The dashboard's own JSON API (server/buildsApi.ts) as RTK Query endpoints. Pages poll while a
 * build is going on. Records are parsed on arrival, so every view gets typed records, never raw
 * JSON. The live checks are never cached: each one asks the clusters again.
 */

export interface ParsedBuild extends Omit<BuildResponse, 'build'> {
  record: BuildRecord
}

export interface ParsedRun {
  serverTime: string
  record: RunRecord
}

export const EVENT_LIMIT = 5000

const at = (...parts: string[]) => parts.map(encodeURIComponent).join('/')

export const buildsApi = createApi({
  reducerPath: 'buildsApi',
  // An absolute base: jsdom's fetch (in tests) can't resolve a relative URL.
  baseQuery: fetchBaseQuery({
    baseUrl: `${globalThis.location?.origin ?? 'http://localhost'}/api`,
  }),
  endpoints: build => ({
    getBuilds: build.query<BuildsResponse, void>({
      query: () => 'builds',
    }),
    getBuild: build.query<ParsedBuild, string>({
      query: buildId => at('builds', buildId),
      transformResponse: ({ build: raw, ...rest }: BuildResponse) => ({
        ...rest,
        record: parseBuild(raw),
      }),
    }),
    getRun: build.query<ParsedRun, { buildId: string; runId: string }>({
      query: ({ buildId, runId }) => at('builds', buildId, 'runs', runId),
      transformResponse: (response: RunResponse) => ({
        serverTime: response.serverTime,
        record: parseRun(response.run),
      }),
    }),
    getEvents: build.query<EventsResponse, { buildId: string; runId: string }>({
      query: ({ buildId, runId }) =>
        `${at('builds', buildId, 'runs', runId, 'events')}?limit=${EVENT_LIMIT}`,
    }),
    getLiveTargets: build.query<LiveTargetsResponse, void>({
      query: () => 'live/targets',
    }),
    getLiveBuild: build.query<LiveBuildResponse, string>({
      query: buildId => at('live', 'builds', buildId),
      keepUnusedDataFor: 0,
    }),
    getLiveEnvironments: build.query<LiveEnvironmentsResponse, void>({
      query: () => 'live/environments',
      keepUnusedDataFor: 0,
    }),
  }),
})

export const {
  useGetBuildsQuery,
  useGetBuildQuery,
  useGetRunQuery,
  useGetEventsQuery,
  useGetLiveTargetsQuery,
  useLazyGetLiveBuildQuery,
  useGetLiveEnvironmentsQuery,
} = buildsApi
