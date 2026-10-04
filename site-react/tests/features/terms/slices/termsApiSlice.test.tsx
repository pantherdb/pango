import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { makeStore } from '@/app/store/store'
import { useGetTermStatsQuery } from '@/features/terms/slices/termsApiSlice'

describe('termsApiSlice', () => {
  let fetchMock: ReturnType<typeof vi.fn<(request: Request) => Promise<Response>>>

  beforeEach(() => {
    vi.stubEnv('VITE_PANGO_API_URL', 'https://api.example.test/')
    fetchMock = vi.fn<(request: Request) => Promise<Response>>()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('returns the child-term statistics for the filter', async () => {
    const termStats = {
      termFrequency: {
        buckets: [
          {
            key: 'protein kinase activity',
            docCount: 520,
            meta: { id: 'GO:0004672', aspect: 'molecular function', parentIds: ['GO:0003824'] },
          },
        ],
      },
    }
    fetchMock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ data: { termStats } }), {
          headers: { 'Content-Type': 'application/json' },
        })
    )
    const filter = { geneIds: [], slimTermIds: ['GO:0003824'], termIds: [] }
    const store = makeStore()

    const { result } = renderHook(() => useGetTermStatsQuery({ filter }), {
      wrapper: ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(termStats)
    const body = await fetchMock.mock.calls[0][0].json()
    expect(body.query).toContain('termStats(filterArgs: $filterArgs)')
    expect(body.variables).toEqual({ filterArgs: filter })
  })
})
