/**
 * The dashboard's only backend: a read-only JSON API mounted on Vite's own dev and preview
 * servers, so there is no separate process to start.
 *
 *   GET /api/builds                                   every build, newest first
 *   GET /api/builds/:build                            one build: build.json, its summary and its runs
 *   GET /api/builds/:build/runs/:run                  the run.json as written
 *   GET /api/builds/:build/runs/:run/events?after=&limit=
 *   GET /api/live/targets                             the configured clusters and APIs
 *   GET /api/live/builds/:build                       the build's cluster and the APIs, now
 *   GET /api/live/environments                        every configured cluster and API, now
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import type {
  BuildSummary,
  LiveBuildResponse,
  LiveEnvironmentsResponse,
} from '../src/features/builds/model/types'
import { createBuildsStore } from './buildsStore'
import type { BuildsStore, StoreResult } from './buildsStore'
import { probeApi, probeEs } from './live'
import type { Fetcher } from './live'
import type { LiveConfig } from './targets'

export const DEFAULT_EVENT_LIMIT = 500
export const MAX_EVENT_LIMIT = 5000

export interface ApiReply {
  status: number
  body: unknown
}

export interface ApiContext {
  store: BuildsStore
  live: LiveConfig
  fetcher: Fetcher
  now?: () => Date
}

const reply = <T>(result: StoreResult<T>): ApiReply =>
  result.ok
    ? { status: 200, body: result.body }
    : { status: result.status, body: { error: result.message } }

const notFound = (what: string): ApiReply => ({ status: 404, body: { error: `No such ${what}` } })

const intParam = (value: string | null, fallback: number, max: number): number => {
  const n = value === null ? NaN : Number.parseInt(value, 10)
  return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : fallback
}

/** The index names a set of builds gave their datasets, and their base names (minus the dataset). */
function knownIndexes(builds: BuildSummary[]): (name: string) => boolean {
  const names = new Set<string>()
  const bases = new Set<string>()
  for (const build of builds) {
    for (const dataset of build.datasets) {
      for (const name of [dataset.indexes?.annotations, dataset.indexes?.genes]) {
        if (!name) continue
        names.add(name)
        if (dataset.id && name.startsWith(`${dataset.id}-`))
          bases.add(name.slice(dataset.id.length + 1))
      }
    }
  }
  if (!names.size) return name => !name.startsWith('.') && name.includes('pango')
  return name => names.has(name) || [...bases].some(base => name.endsWith(`-${base}`))
}

async function liveBuild(ctx: ApiContext, id: string): Promise<ApiReply> {
  const build = ctx.store.buildRecord(id)
  if (!build) return notFound(`build ${id}`)
  const indexes = build.datasets
    .flatMap(d => [d.indexes?.annotations, d.indexes?.genes])
    .filter((n): n is string => !!n)
  const versions = build.datasets
    .map(d => d.id)
    .filter((v): v is string => !!v && ctx.live.versions.includes(v))
  const esUrl = ctx.live.buildEsUrl ?? build.esUrl
  const [es, api] = await Promise.all([
    esUrl
      ? probeEs({ name: 'build', url: esUrl }, indexes, ctx.fetcher, ctx.live.timeoutMs)
      : Promise.resolve(null),
    Promise.all(
      ctx.live.api.map(target => probeApi(target, versions, ctx.fetcher, ctx.live.timeoutMs))
    ),
  ])
  const body: LiveBuildResponse = { serverTime: (ctx.now?.() ?? new Date()).toISOString(), es, api }
  return { status: 200, body }
}

async function liveEnvironments(ctx: ApiContext): Promise<ApiReply> {
  const wanted = knownIndexes(ctx.store.builds().builds)
  // `latest` is asked about too: the API serves one of the versions under that name.
  const versions = [...ctx.live.versions, 'latest']
  const [es, api] = await Promise.all([
    Promise.all(
      ctx.live.es.map(target => probeEs(target, wanted, ctx.fetcher, ctx.live.timeoutMs))
    ),
    Promise.all(
      ctx.live.api.map(target => probeApi(target, versions, ctx.fetcher, ctx.live.timeoutMs))
    ),
  ])
  const body: LiveEnvironmentsResponse = {
    serverTime: (ctx.now?.() ?? new Date()).toISOString(),
    es,
    api,
  }
  return { status: 200, body }
}

/** Routes one request. Pure apart from the store's reads and the probes, so tests call it directly. */
export async function handleApiRequest(
  ctx: ApiContext,
  method: string,
  url: string
): Promise<ApiReply> {
  if (method !== 'GET') return { status: 405, body: { error: 'The builds API is read-only.' } }
  const parsed = new URL(url, 'http://dashboard.local')
  let parts: string[]
  try {
    parts = parsed.pathname
      .replace(/^\/api\/?/, '')
      .split('/')
      .filter(Boolean)
      .map(decodeURIComponent)
  } catch {
    return notFound('endpoint')
  }

  if (parts[0] === 'builds') {
    if (parts.length === 1) return { status: 200, body: ctx.store.builds() }
    if (parts.length === 2) return reply(ctx.store.build(parts[1]))
    if (parts[2] === 'runs' && parts.length === 4) return reply(ctx.store.run(parts[1], parts[3]))
    if (parts[2] === 'runs' && parts[4] === 'events' && parts.length === 5) {
      const after = intParam(parsed.searchParams.get('after'), 0, Number.MAX_SAFE_INTEGER)
      const limit = intParam(parsed.searchParams.get('limit'), DEFAULT_EVENT_LIMIT, MAX_EVENT_LIMIT)
      return reply(ctx.store.events(parts[1], parts[3], after, limit || DEFAULT_EVENT_LIMIT))
    }
  }
  if (parts[0] === 'live') {
    if (parts[1] === 'targets' && parts.length === 2) {
      return {
        status: 200,
        body: { targets: [...ctx.live.es, ...ctx.live.api], versions: ctx.live.versions },
      }
    }
    if (parts[1] === 'builds' && parts.length === 3) return liveBuild(ctx, parts[2])
    if (parts[1] === 'environments' && parts.length === 2) return liveEnvironments(ctx)
  }
  return { status: 404, body: { error: `No such endpoint: ${parsed.pathname}` } }
}

export interface BuildsApiOptions {
  buildsDir: string
  live: LiveConfig
  fetcher?: Fetcher
}

export function buildsApi({ buildsDir, live, fetcher = fetch }: BuildsApiOptions): Plugin {
  const ctx: ApiContext = { store: createBuildsStore({ buildsDir }), live, fetcher }
  const middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/')) return next()
    handleApiRequest(ctx, req.method ?? 'GET', req.url)
      .catch((error: unknown): ApiReply => ({
        status: 500,
        body: { error: error instanceof Error ? error.message : String(error) },
      }))
      .then(answer => {
        res.statusCode = answer.status
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify(answer.body))
      })
  }
  return {
    name: 'pango-build-dashboard-api',
    configureServer(server) {
      server.config.logger.info(`  builds dir: ${buildsDir}`)
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
