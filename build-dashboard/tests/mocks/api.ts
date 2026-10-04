import { vi } from 'vitest'
import { handleApiRequest } from '../../server/buildsApi'
import type { ApiContext } from '../../server/buildsApi'
import { createBuildsStore } from '../../server/buildsStore'
import { FIXTURES, LIVE_CONFIG, fakeUpstream } from './upstream'
import type { Upstream } from './upstream'

/** The clock the fixtures are judged by: the synthetic running build wrote 5 s before it. */
export const FIXTURE_NOW = new Date('2026-10-04T14:00:00Z')

export interface ServedBuilds {
  ctx: ApiContext
  upstream: Upstream
  /** The dashboard API requests the page made, as paths. */
  calls: string[]
}

/**
 * Answers the page's `fetch` with the real API handler and store over the fixture builds, at a
 * pinned clock; the live checks go to a fake upstream. Pages under test therefore read exactly
 * what the dev server would serve them.
 */
export function serveBuilds({ buildsDir = FIXTURES, now = FIXTURE_NOW } = {}): ServedBuilds {
  const upstream = fakeUpstream()
  const ctx: ApiContext = {
    store: createBuildsStore({ buildsDir, now: () => now }),
    live: LIVE_CONFIG,
    fetcher: upstream.fetcher,
    now: () => now,
  }
  const calls: string[] = []
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init)
    const url = new URL(request.url)
    calls.push(url.pathname + url.search)
    const answer = await handleApiRequest(ctx, request.method, url.pathname + url.search)
    return new Response(JSON.stringify(answer.body), {
      status: answer.status,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  return { ctx, upstream, calls }
}
