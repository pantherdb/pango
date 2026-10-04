/**
 * Which Elasticsearch clusters and GraphQL APIs the live checks may ask, from the dashboard's
 * server-side environment (.env.local or the shell). See .env.example.
 */

import type { LiveTarget } from '../src/features/builds/model/types'

export const DEFAULT_ES_TARGETS = 'local=http://localhost:9200'
export const DEFAULT_API_TARGETS = 'production=https://functionome.geneontology.org/api/graphql'
export const DEFAULT_API_VERSIONS = 'pango-1,pango-2'
export const PROBE_TIMEOUT_MS = 8000

export interface LiveConfig {
  es: LiveTarget[]
  api: LiveTarget[]
  /** The API versions (dataset names) the APIs are asked about. */
  versions: string[]
  /**
   * The cluster a build's live check asks instead of the es_url the build recorded: for when
   * the dashboard reaches that cluster at another address (LIVE_BUILD_ES_URL).
   */
  buildEsUrl: string | null
  timeoutMs: number
}

const isHttp = (url: string) => {
  try {
    const { protocol } = new URL(url)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/** `name=url,name=url`; entries without a name, or not http(s), are dropped. */
export function parseTargets(value: string | undefined, kind: LiveTarget['kind']): LiveTarget[] {
  return (value ?? '')
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)
    .flatMap(entry => {
      const at = entry.indexOf('=')
      const name = entry.slice(0, at).trim()
      const url = entry
        .slice(at + 1)
        .trim()
        .replace(/\/+$/, '')
      return at > 0 && name && isHttp(url) ? [{ name, kind, url }] : []
    })
}

export function liveConfigFromEnv(env: Record<string, string | undefined>): LiveConfig {
  return {
    es: parseTargets(env.LIVE_ES_TARGETS || DEFAULT_ES_TARGETS, 'es'),
    api: parseTargets(env.LIVE_API_TARGETS || DEFAULT_API_TARGETS, 'api'),
    versions: (env.LIVE_API_VERSIONS || DEFAULT_API_VERSIONS)
      .split(',')
      .map(version => version.trim())
      .filter(Boolean),
    buildEsUrl:
      env.LIVE_BUILD_ES_URL && isHttp(env.LIVE_BUILD_ES_URL)
        ? env.LIVE_BUILD_ES_URL.replace(/\/+$/, '')
        : null,
    timeoutMs: PROBE_TIMEOUT_MS,
  }
}

export { isHttp }
