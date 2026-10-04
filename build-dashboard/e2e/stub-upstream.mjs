// A stand-in for Elasticsearch and the GraphQL API, for the Playwright specs. It answers the
// read-only requests the live checks make, from the full-data capture in the fixtures, so that
// build's live check matches; it also holds one index no recorded build made. It refuses anything
// but GET on /es and mutations on /graphql, like the dashboard's own guards.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

const PORT = Number(process.env.STUB_PORT ?? 4212)
const BUILDS = path.resolve('tests/fixtures/builds')
const FULL = '20261004T090254Z-all-3002'

const read = file => JSON.parse(fs.readFileSync(file, 'utf-8'))
const build = read(path.join(BUILDS, FULL, 'build.json'))
const runs = fs
  .readdirSync(path.join(BUILDS, FULL, 'runs'))
  .map(dir => read(path.join(BUILDS, FULL, 'runs', dir, 'run.json')))
const runOf = (dataset, step) => runs.find(run => run.dataset === dataset && run.step === step)

const indexes = new Map()
const versions = {}
for (const dataset of build.datasets) {
  const report = runOf(dataset.id, 'report')
  const created = Date.parse(runOf(dataset.id, 'index_es').started_at) + 1000
  indexes.set(dataset.indexes.annotations, { docs: report.counters.annotations, created })
  indexes.set(dataset.indexes.genes, { docs: report.counters.genes, created: created + 30_000 })
  versions[dataset.id] = { annotations: report.counters.annotations, genes: report.counters.genes }
}
indexes.set('pango-old-pango-genes', { docs: 12, created: Date.parse('2025-01-30T00:00:00Z') })
versions.latest = versions['pango-1']

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

http
  .createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://stub')
    if (url.pathname === '/health') return send(res, 200, { ok: true })
    if (url.pathname === '/es' || url.pathname.startsWith('/es/')) {
      if (req.method !== 'GET') return send(res, 405, { error: { type: 'read_only_stub' } })
      const route = url.pathname.slice(3) || '/'
      if (route === '/')
        return send(res, 200, { cluster_name: 'stub-cluster', version: { number: '8.5.0' } })
      if (route === '/_cat/indices') {
        return send(
          res,
          200,
          [...indexes].map(([index, i]) => ({
            index,
            health: 'green',
            'creation.date': String(i.created),
          }))
        )
      }
      const count = route.match(/^\/([^/]+)\/_count$/)
      const index = count && indexes.get(decodeURIComponent(count[1]))
      return index
        ? send(res, 200, { count: index.docs })
        : send(res, 404, { error: { type: 'index_not_found_exception' } })
    }
    if (url.pathname === '/graphql' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => (body += chunk))
      req.on('end', () => {
        const { query } = JSON.parse(body || '{}')
        if (/\bmutation\b/i.test(query ?? ''))
          return send(res, 400, { errors: [{ message: 'No mutations here' }] })
        const counts = versions[String(req.headers['x-api-version'])]
        if (!counts) return send(res, 200, { data: null, errors: [{ message: 'Unknown version' }] })
        send(res, 200, {
          data: {
            annotationsCount: { total: counts.annotations },
            genesCount: { total: counts.genes },
          },
        })
      })
      return
    }
    send(res, 404, { error: 'Not found' })
  })
  .listen(PORT, () => console.log(`stub upstream on http://localhost:${PORT}`))
