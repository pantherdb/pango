// @vitest-environment node
import {
  BLOCKED_MESSAGE,
  assertEsReadOnly,
  assertQueryOnly,
  probeApi,
  probeEs,
} from '../../server/live'
import { liveConfigFromEnv, parseTargets } from '../../server/targets'
import { API_URL, ES_URL, fakeUpstream } from '@tests/mocks/upstream'

describe('the read-only guards', () => {
  it('allow only the reads the dashboard makes of Elasticsearch', () => {
    expect(() => assertEsReadOnly('GET', '/')).not.toThrow()
    expect(() => assertEsReadOnly('GET', '/_cat/indices')).not.toThrow()
    expect(() => assertEsReadOnly('GET', '/pango-2-pango-genes/_count')).not.toThrow()
    for (const [method, path] of [
      ['POST', '/pango-2-pango-genes/_count'],
      ['DELETE', '/pango-2-pango-genes'],
      ['GET', '/pango-2-pango-genes/_refresh'],
      ['PUT', '/x/_doc/1'],
      ['GET', '/_cluster/settings'],
    ]) {
      expect(() => assertEsReadOnly(method, path), `${method} ${path}`).toThrow(/Refused/)
    }
  })

  it('refuse a GraphQL document that could change anything', () => {
    expect(() => assertQueryOnly('query { genesCount { total } }')).not.toThrow()
    expect(() => assertQueryOnly('mutation { deleteAll }')).toThrow(/Refused/)
    expect(() => assertQueryOnly('subscription { x }')).toThrow(/Refused/)
  })
})

describe('probeEs', () => {
  it('lists the wanted indexes with their counts from _count and their creation times', async () => {
    const upstream = fakeUpstream()
    const probe = await probeEs(
      { name: 'local', url: ES_URL },
      ['pango-2-pango-genes', 'nope'],
      upstream.fetcher,
      1000
    )
    expect(probe).toMatchObject({
      reachable: true,
      version: '8.5.0',
      cluster: 'test-cluster',
      error: null,
    })
    expect(probe.indexes).toEqual([
      expect.objectContaining({
        name: 'pango-2-pango-genes',
        exists: true,
        docs: 20580,
        health: 'green',
      }),
      { name: 'nope', exists: false, docs: null, health: null, createdAt: null, error: null },
    ])
    expect(upstream.requests).toEqual([
      `GET ${ES_URL}/`,
      `GET ${ES_URL}/_cat/indices?format=json&h=index,health,creation.date`,
      `GET ${ES_URL}/pango-2-pango-genes/_count`,
    ])
  })

  it('picks indexes by a predicate', async () => {
    const probe = await probeEs(
      { name: 'local', url: ES_URL },
      name => name.endsWith('-pango-genes'),
      fakeUpstream().fetcher,
      1000
    )
    expect(probe.indexes.map(ix => ix.name)).toEqual([
      'pango-1-pango-genes',
      'pango-2-pango-genes',
      'pango-old-pango-genes',
    ])
  })

  it('answers "unreachable" instead of throwing', async () => {
    const upstream = fakeUpstream()
    upstream.down.es = true
    const probe = await probeEs({ name: 'local', url: ES_URL }, ['x'], upstream.fetcher, 1000)
    expect(probe).toMatchObject({ reachable: false, error: 'fetch failed', indexes: [] })
    expect(
      await probeEs({ name: 'bad', url: 'file:///etc' }, [], upstream.fetcher, 1000)
    ).toMatchObject({ error: 'Not an http(s) URL' })
  })
})

describe('probeApi', () => {
  it('asks for the counts of each version in the X-API-Version header', async () => {
    const probe = await probeApi(
      { name: 'production', url: API_URL },
      ['pango-2', 'latest', 'pango-9'],
      fakeUpstream().fetcher,
      1000
    )
    expect(probe.reachable).toBe(true)
    expect(probe.versions).toEqual([
      { version: 'pango-2', annotations: 86886, genes: 20580, error: null, blocked: false },
      { version: 'latest', annotations: 90961, genes: 20851, error: null, blocked: false },
      {
        version: 'pango-9',
        annotations: null,
        genes: null,
        error: 'Unknown version',
        blocked: false,
      },
    ])
  })

  it("names a bot challenge (production's Cloudflare) instead of a bare 403", async () => {
    const upstream = fakeUpstream()
    upstream.challenge = true
    const probe = await probeApi(
      { name: 'production', url: API_URL },
      ['pango-1', 'pango-2'],
      upstream.fetcher,
      1000
    )
    expect(probe).toMatchObject({ reachable: false, blocked: true, error: BLOCKED_MESSAGE })
    expect(probe.versions.every(version => version.blocked)).toBe(true)
  })

  it('makes no request when there is nothing to ask', async () => {
    const upstream = fakeUpstream()
    expect(await probeApi({ name: 'p', url: API_URL }, [], upstream.fetcher, 1000)).toMatchObject({
      reachable: false,
      error: null,
    })
    expect(upstream.requests).toEqual([])
  })

  it('answers "unreachable" when the API is down', async () => {
    const upstream = fakeUpstream()
    upstream.down.api = true
    expect(
      await probeApi({ name: 'p', url: API_URL }, ['pango-1'], upstream.fetcher, 1000)
    ).toMatchObject({
      reachable: false,
      error: 'fetch failed',
    })
  })
})

describe('the live targets', () => {
  it('read name=url pairs, dropping what is not http(s)', () => {
    expect(
      parseTargets(
        'local=http://localhost:9200/, prod = https://x.org/api/graphql,junk,ftp=ftp://x',
        'es'
      )
    ).toEqual([
      { name: 'local', kind: 'es', url: 'http://localhost:9200' },
      { name: 'prod', kind: 'es', url: 'https://x.org/api/graphql' },
    ])
  })

  it('default to the local cluster and the production API', () => {
    const config = liveConfigFromEnv({})
    expect(config.es).toEqual([{ name: 'local', kind: 'es', url: 'http://localhost:9200' }])
    expect(config.api).toEqual([
      { name: 'production', kind: 'api', url: 'https://functionome.geneontology.org/api/graphql' },
    ])
    expect(config.versions).toEqual(['pango-1', 'pango-2'])
    expect(config.buildEsUrl).toBeNull()
    expect(liveConfigFromEnv({ LIVE_BUILD_ES_URL: 'http://es:9200/' }).buildEsUrl).toBe(
      'http://es:9200'
    )
  })
})
