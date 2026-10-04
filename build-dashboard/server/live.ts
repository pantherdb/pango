/**
 * The live checks: what an Elasticsearch cluster or a GraphQL API holds right now.
 *
 * Read-only by construction. Elasticsearch gets GET requests to an allowlist of paths (the root,
 * `_cat/indices` and `<index>/_count`), so nothing here can refresh, write or delete; the API gets
 * one fixed count query, and any document holding a mutation is refused before it is sent. Every
 * request has a timeout, and a failure becomes an answer ("unreachable"), never an exception.
 */

import type {
  ApiProbe,
  ApiVersionLive,
  EsIndexLive,
  EsProbe,
} from '../src/features/builds/model/types'
import { isHttp } from './targets'

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>

const ES_READ_PATHS = [/^\/$/, /^\/_cat\/indices$/, /^\/[^/_][^/]*\/_count$/]

/** Throws unless the request is a GET to one of the allowed Elasticsearch paths. */
export function assertEsReadOnly(method: string, path: string): void {
  if (method !== 'GET' || !ES_READ_PATHS.some(allowed => allowed.test(path))) {
    throw new Error(`Refused: ${method} ${path} is not a read the dashboard makes`)
  }
}

/** Throws if a GraphQL document could change anything. */
export function assertQueryOnly(document: string): void {
  if (/\b(mutation|subscription)\b/i.test(document)) {
    throw new Error('Refused: the dashboard only sends queries')
  }
}

export const COUNTS_QUERY =
  'query BuildDashboardCounts { annotationsCount { total } genesCount { total } }'

const message = (error: unknown) =>
  error instanceof Error
    ? error.name === 'TimeoutError'
      ? 'Timed out'
      : error.message
    : String(error)

async function esGet(
  fetcher: Fetcher,
  base: string,
  path: string,
  timeoutMs: number
): Promise<unknown> {
  assertEsReadOnly('GET', path.split('?')[0])
  const response = await fetcher(`${base}${path}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const reason = (body as { error?: { type?: string } } | null)?.error?.type
    throw new Error(`HTTP ${response.status}${reason ? ` (${reason})` : ''}`)
  }
  return body
}

interface CatIndex {
  index?: string
  health?: string
  'creation.date'?: string
}

/**
 * A cluster and some of its indexes. `wanted` lists index names to look up, or a predicate over
 * the names `_cat/indices` returns.
 */
export async function probeEs(
  target: { name: string; url: string },
  wanted: string[] | ((name: string) => boolean),
  fetcher: Fetcher,
  timeoutMs: number
): Promise<EsProbe> {
  const probe: EsProbe = {
    target: target.name,
    url: target.url,
    reachable: false,
    error: null,
    version: null,
    cluster: null,
    indexes: [],
  }
  if (!isHttp(target.url)) return { ...probe, error: 'Not an http(s) URL' }
  try {
    const root = (await esGet(fetcher, target.url, '/', timeoutMs)) as {
      cluster_name?: string
      version?: { number?: string }
    }
    probe.reachable = true
    probe.version = root?.version?.number ?? null
    probe.cluster = root?.cluster_name ?? null
    const cat = (await esGet(
      fetcher,
      target.url,
      '/_cat/indices?format=json&h=index,health,creation.date',
      timeoutMs
    )) as CatIndex[]
    const listed = new Map(
      (Array.isArray(cat) ? cat : [])
        .filter(row => row.index)
        .map(row => [row.index as string, row])
    )
    const names = Array.isArray(wanted) ? wanted : [...listed.keys()].filter(wanted).sort()
    probe.indexes = await Promise.all(
      names.map(async (name): Promise<EsIndexLive> => {
        const row = listed.get(name)
        if (!row)
          return { name, exists: false, docs: null, health: null, createdAt: null, error: null }
        const created = Number(row['creation.date'])
        const live: EsIndexLive = {
          name,
          exists: true,
          docs: null,
          health: row.health ?? null,
          createdAt: Number.isFinite(created) ? new Date(created).toISOString() : null,
          error: null,
        }
        try {
          // _count, not _cat's docs.count: that one counts nested documents too.
          const count = (await esGet(
            fetcher,
            target.url,
            `/${encodeURIComponent(name)}/_count`,
            timeoutMs
          )) as { count?: number }
          live.docs = typeof count?.count === 'number' ? count.count : null
        } catch (error) {
          live.error = message(error)
        }
        return live
      })
    )
  } catch (error) {
    probe.error = message(error)
  }
  return probe
}

export const BLOCKED_MESSAGE =
  "Blocked by the site's bot protection (Cloudflare challenge, HTTP 403): it refuses requests from scripts"

/**
 * A bot challenge, not an answer: a site behind Cloudflare's managed challenge (production is,
 * 2026-10-04) answers a script with a 403 page asking for JavaScript. The dashboard doesn't try to
 * get past it; it says so.
 */
export const isBotChallenge = (response: Response): boolean =>
  response.headers.get('cf-mitigated') === 'challenge' ||
  (response.status === 403 && (response.headers.get('server') ?? '').toLowerCase() === 'cloudflare')

async function countsFor(
  fetcher: Fetcher,
  url: string,
  version: string,
  timeoutMs: number
): Promise<ApiVersionLive> {
  assertQueryOnly(COUNTS_QUERY)
  const nothing = { version, annotations: null, genes: null }
  try {
    const response = await fetcher(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-API-Version': version,
      },
      body: JSON.stringify({ query: COUNTS_QUERY }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (isBotChallenge(response)) return { ...nothing, error: BLOCKED_MESSAGE, blocked: true }
    const body = (await response.json().catch(() => null)) as {
      data?: { annotationsCount?: { total?: number }; genesCount?: { total?: number } }
      errors?: { message?: string }[]
    } | null
    if (!response.ok || !body?.data) {
      return {
        ...nothing,
        error: body?.errors?.[0]?.message ?? `HTTP ${response.status}`,
        blocked: false,
      }
    }
    return {
      version,
      annotations: body.data.annotationsCount?.total ?? null,
      genes: body.data.genesCount?.total ?? null,
      error: null,
      blocked: false,
    }
  } catch (error) {
    return { ...nothing, error: message(error), blocked: false }
  }
}

/** One count query per version, with the version in the X-API-Version header. */
export async function probeApi(
  target: { name: string; url: string },
  versions: string[],
  fetcher: Fetcher,
  timeoutMs: number
): Promise<ApiProbe> {
  const probe = { target: target.name, url: target.url, reachable: false, blocked: false }
  if (!isHttp(target.url)) return { ...probe, error: 'Not an http(s) URL', versions: [] }
  // Nothing to ask (no version of interest): no request, and no claim about reachability.
  if (!versions.length) return { ...probe, error: null, versions: [] }
  const answers = await Promise.all(
    versions.map(version => countsFor(fetcher, target.url, version, timeoutMs))
  )
  const reachable = answers.some(answer => answer.error === null)
  return {
    ...probe,
    reachable,
    blocked: answers.every(answer => answer.blocked),
    error: reachable ? null : (answers[0]?.error ?? null),
    versions: answers,
  }
}
