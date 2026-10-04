// @vitest-environment node
import { handleApiRequest } from '../../server/buildsApi'
import type { ApiContext } from '../../server/buildsApi'
import { createBuildsStore } from '../../server/buildsStore'
import type { LiveBuildResponse, LiveEnvironmentsResponse } from '@/features/builds/model/types'
import { FIXTURE_NOW } from '@tests/mocks/api'
import { FIXTURES, FULL_BUILD, LIVE_CONFIG, fakeUpstream } from '@tests/mocks/upstream'

const context = (): ApiContext & { upstream: ReturnType<typeof fakeUpstream> } => {
  const upstream = fakeUpstream()
  return {
    store: createBuildsStore({ buildsDir: FIXTURES, now: () => FIXTURE_NOW }),
    live: LIVE_CONFIG,
    fetcher: upstream.fetcher,
    now: () => FIXTURE_NOW,
    upstream,
  }
}

describe('the builds API', () => {
  it('is read-only', async () => {
    for (const method of ['POST', 'PUT', 'DELETE']) {
      expect((await handleApiRequest(context(), method, '/api/builds')).status).toBe(405)
    }
  })

  it('routes the builds endpoints', async () => {
    const ctx = context()
    expect((await handleApiRequest(ctx, 'GET', '/api/builds')).status).toBe(200)
    expect((await handleApiRequest(ctx, 'GET', `/api/builds/${FULL_BUILD}`)).status).toBe(200)
    expect((await handleApiRequest(ctx, 'GET', '/api/builds/nope')).status).toBe(404)
    expect((await handleApiRequest(ctx, 'GET', '/api/builds/%2E%2E')).status).toBe(404)
    expect((await handleApiRequest(ctx, 'GET', '/api/whatever')).status).toBe(404)
  })

  it('caps the events a request can ask for', async () => {
    const ctx = context()
    const build = (await handleApiRequest(ctx, 'GET', `/api/builds/${FULL_BUILD}`)).body as {
      runs: { runId: string }[]
    }
    const runId = build.runs[0].runId
    const reply = await handleApiRequest(
      ctx,
      'GET',
      `/api/builds/${FULL_BUILD}/runs/${runId}/events?after=2&limit=2`
    )
    expect((reply.body as { events: { seq: number }[] }).events.map(e => e.seq)).toEqual([3, 4])
  })

  it('lists the live targets without asking them anything', async () => {
    const ctx = context()
    const reply = await handleApiRequest(ctx, 'GET', '/api/live/targets')
    expect(reply.body).toEqual({
      targets: [...LIVE_CONFIG.es, ...LIVE_CONFIG.api],
      versions: ['pango-1', 'pango-2'],
    })
    expect(ctx.upstream.requests).toEqual([])
  })

  it("checks a build's indexes and its versions on the APIs", async () => {
    const ctx = context()
    const reply = await handleApiRequest(ctx, 'GET', `/api/live/builds/${FULL_BUILD}`)
    const body = reply.body as LiveBuildResponse
    expect(body.es?.indexes.map(ix => [ix.name, ix.docs])).toEqual([
      ['pango-1-pango-annotations', 90961],
      ['pango-1-pango-genes', 20851],
      ['pango-2-pango-annotations', 86886],
      ['pango-2-pango-genes', 20580],
    ])
    expect(body.api[0].versions.map(v => v.version)).toEqual(['pango-1', 'pango-2'])
    expect(
      ctx.upstream.requests.every(
        request =>
          request.startsWith('GET http://es.test') || request === 'POST http://api.test/graphql'
      )
    ).toBe(true)
  })

  it('checks every configured target for the environments page, latest included', async () => {
    const ctx = context()
    const body = (await handleApiRequest(ctx, 'GET', '/api/live/environments'))
      .body as LiveEnvironmentsResponse
    expect(body.es[0].indexes.map(ix => ix.name)).toEqual([
      'pango-1-pango-annotations',
      'pango-1-pango-genes',
      'pango-2-pango-annotations',
      'pango-2-pango-genes',
      'pango-old-pango-genes',
    ])
    expect(body.api[0].versions.map(v => v.version)).toEqual(['pango-1', 'pango-2', 'latest'])
  })
})
