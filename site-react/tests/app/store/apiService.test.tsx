import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { makeStore } from '@/app/store/store'
import {
  ApiVersions,
  createGraphQLRequest,
  resolveApiVersion,
  useApiVersion,
} from '@/app/store/apiService'
import { useGetGenesCountQuery } from '@/features/genes/slices/genesApiSlice'

const useVersionAndSearch = () => ({ ...useApiVersion(), search: useLocation().search })

const renderVersion = (route: string) =>
  renderHook(useVersionAndSearch, {
    wrapper: ({ children }: PropsWithChildren) => (
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    ),
  })

const param = (search: string, name: string) => new URLSearchParams(search).get(name)

describe('useApiVersion', () => {
  it('reads the version from ?apiVersion, defaulting to the latest', () => {
    expect(renderVersion('/').result.current.currentVersion).toBe(ApiVersions.V2)
    expect(renderVersion('/?apiVersion=pango-1').result.current.currentVersion).toBe(ApiVersions.V1)
  })

  it('puts an older version in the URL and drops the parameter for the latest', () => {
    const { result } = renderVersion('/gene/UniProtKB:P04637?tab=evidence')

    act(() => result.current.setVersion(ApiVersions.V1))
    expect(param(result.current.search, 'apiVersion')).toBe('pango-1')
    expect(param(result.current.search, 'tab')).toBe('evidence')

    act(() => result.current.setVersion(result.current.LATEST_VERSION))
    expect(param(result.current.search, 'apiVersion')).toBeNull()
    expect(param(result.current.search, 'tab')).toBe('evidence')
  })
})

describe('createGraphQLRequest', () => {
  it('posts the query and its variables to the graphql endpoint', () => {
    expect(createGraphQLRequest('query Q { a }', { x: 1 })).toEqual({
      url: 'graphql',
      method: 'POST',
      body: { query: 'query Q { a }', variables: { x: 1 } },
    })
  })
})

describe('API requests', () => {
  let fetchMock: ReturnType<typeof vi.fn<(request: Request) => Promise<Response>>>

  beforeEach(() => {
    vi.stubEnv('VITE_PANGO_API_URL', 'https://api.example.test/')
    fetchMock = vi.fn(
      async (_request: Request) =>
        new Response(JSON.stringify({ data: { genesCount: { total: 1 } } }), {
          headers: { 'Content-Type': 'application/json' },
        })
    )
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    window.history.replaceState({}, '', '/')
  })

  const sendRequest = async () => {
    const store = makeStore()
    const { result } = renderHook(() => useGetGenesCountQuery({ filter: { geneIds: [] } }), {
      wrapper: ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    return fetchMock.mock.calls[0][0]
  }

  it('posts JSON to the configured API with the latest version by default', async () => {
    const request = await sendRequest()

    expect(request.url).toBe('https://api.example.test/graphql')
    expect(request.method).toBe('POST')
    expect(request.headers.get('Content-Type')).toBe('application/json')
    expect(request.headers.get('X-API-Version')).toBe(ApiVersions.V2)
  })

  it("sends the page's ?apiVersion with every request", async () => {
    window.history.replaceState({}, '', '/?apiVersion=pango-1')

    const request = await sendRequest()

    expect(request.headers.get('X-API-Version')).toBe('pango-1')
  })

  it('asks for the latest version when ?apiVersion is not one the API knows', async () => {
    window.history.replaceState({}, '', '/?apiVersion=pango-9')

    const request = await sendRequest()

    expect(request.headers.get('X-API-Version')).toBe(ApiVersions.V2)
  })
})

describe('resolveApiVersion', () => {
  it('accepts the known versions and treats anything else as the latest', () => {
    expect(resolveApiVersion('pango-1')).toBe(ApiVersions.V1)
    expect(resolveApiVersion('pango-2')).toBe(ApiVersions.V2)
    expect(resolveApiVersion('pango-9')).toBe(ApiVersions.V2)
    expect(resolveApiVersion(null)).toBe(ApiVersions.V2)
  })
})
