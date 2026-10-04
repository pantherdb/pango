import fs from 'node:fs'
import path from 'node:path'
import type { Fetcher } from '../../server/live'
import type { LiveConfig } from '../../server/targets'

/**
 * A fake Elasticsearch and GraphQL API for the live checks, answering from the full-data capture
 * in the fixtures (the same idea as e2e/stub-upstream.mjs): its two datasets' indexes hold what
 * the build recorded and were created during its index_es runs; the API serves the same counts,
 * and `latest` serves pango-1. One index on the cluster was made by no recorded build.
 */

export const FIXTURES = path.resolve(__dirname, '../fixtures/builds')
export const FULL_BUILD = '20261004T090254Z-all-3002'
export const ES_URL = 'http://es.test'
export const API_URL = 'http://api.test/graphql'

export const LIVE_CONFIG: LiveConfig = {
  es: [{ name: 'local', kind: 'es', url: ES_URL }],
  api: [{ name: 'production', kind: 'api', url: API_URL }],
  versions: ['pango-1', 'pango-2'],
  buildEsUrl: ES_URL,
  timeoutMs: 1000,
}

const read = (file: string) => JSON.parse(fs.readFileSync(file, 'utf-8'))

interface FakeIndex {
  docs: number
  created: number
}

export interface Upstream {
  fetcher: Fetcher
  indexes: Map<string, FakeIndex>
  versions: Record<string, { annotations: number; genes: number }>
  /** Every request made, as `METHOD url`. */
  requests: string[]
  down: { es: boolean; api: boolean }
  /** The API answers as production does to a script: Cloudflare's challenge page, HTTP 403. */
  challenge: boolean
}

export function fakeUpstream(): Upstream {
  const build = read(path.join(FIXTURES, FULL_BUILD, 'build.json'))
  const runsDir = path.join(FIXTURES, FULL_BUILD, 'runs')
  const runs = fs.readdirSync(runsDir).map(dir => read(path.join(runsDir, dir, 'run.json')))
  const runOf = (dataset: string, step: string) =>
    runs.find(run => run.dataset === dataset && run.step === step)

  const indexes = new Map<string, FakeIndex>()
  const versions: Upstream['versions'] = {}
  for (const dataset of build.datasets) {
    const report = runOf(dataset.id, 'report')
    const created = Date.parse(runOf(dataset.id, 'index_es').started_at) + 1000
    indexes.set(dataset.indexes.annotations, { docs: report.counters.annotations, created })
    indexes.set(dataset.indexes.genes, { docs: report.counters.genes, created: created + 30_000 })
    versions[dataset.id] = {
      annotations: report.counters.annotations,
      genes: report.counters.genes,
    }
  }
  indexes.set('pango-old-pango-genes', { docs: 12, created: Date.parse('2025-01-30T00:00:00Z') })
  versions.latest = versions['pango-1']

  const upstream: Upstream = {
    indexes,
    versions,
    requests: [],
    down: { es: false, api: false },
    challenge: false,
    fetcher: async () => new Response(),
  }
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

  upstream.fetcher = async (url, init) => {
    const method = init?.method ?? 'GET'
    upstream.requests.push(`${method} ${url}`)
    if (url.startsWith(ES_URL)) {
      if (upstream.down.es) throw new TypeError('fetch failed')
      const route = new URL(url).pathname
      if (route === '/') return json({ cluster_name: 'test-cluster', version: { number: '8.5.0' } })
      if (route === '/_cat/indices') {
        return json(
          [...indexes].map(([index, i]) => ({
            index,
            health: 'green',
            'creation.date': String(i.created),
          }))
        )
      }
      const index = indexes.get(decodeURIComponent(route.split('/')[1]))
      return index
        ? json({ count: index.docs })
        : json({ error: { type: 'index_not_found_exception' } }, 404)
    }
    if (url === API_URL) {
      if (upstream.down.api) throw new TypeError('fetch failed')
      if (upstream.challenge) {
        return new Response('<!DOCTYPE html><title>Just a moment...</title>', {
          status: 403,
          headers: {
            'Content-Type': 'text/html',
            Server: 'cloudflare',
            'Cf-Mitigated': 'challenge',
          },
        })
      }
      const version = new Headers(init?.headers).get('X-API-Version') ?? ''
      const counts = versions[version]
      if (!counts) return json({ data: null, errors: [{ message: 'Unknown version' }] })
      return json({
        data: {
          annotationsCount: { total: counts.annotations },
          genesCount: { total: counts.genes },
        },
      })
    }
    throw new TypeError(`fetch failed: nothing at ${url}`)
  }
  return upstream
}
