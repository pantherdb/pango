import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { buildCategoryTerm, buildGene, buildTerm } from '@tests/fixtures/builders'
import { queryResult } from '@tests/fixtures/mocks'
import { buildSearchState } from '@tests/fixtures/state'
import { makeStore } from '@/app/store/store'
import type * as GenesApiSlice from '@/features/genes/slices/genesApiSlice'
import { useGetGenesStatsQuery } from '@/features/genes/slices/genesApiSlice'
import { useGeneStats } from '@/features/genes/hooks/useGeneStats'

vi.mock('@/features/genes/slices/genesApiSlice', async importOriginal => ({
  ...(await importOriginal<typeof GenesApiSlice>()),
  useGetGenesStatsQuery: vi.fn(),
}))

describe('useGeneStats', () => {
  it('asks for the category statistics of the selected filters', () => {
    const stats = queryResult({ slimTermFrequency: { buckets: [] } })
    vi.mocked(useGetGenesStatsQuery).mockReturnValue(stats)
    const store = makeStore({
      search: buildSearchState({
        genes: [buildGene()],
        slimTerms: [buildCategoryTerm()],
        terms: [buildTerm({ id: 'GO:0004672' })],
      }),
    })

    const { result } = renderHook(() => useGeneStats(), {
      wrapper: ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>,
    })

    expect(useGetGenesStatsQuery).toHaveBeenCalledWith({
      filter: {
        geneIds: ['UniProtKB:P04637'],
        slimTermIds: ['GO:0003824'],
        termIds: ['GO:0004672'],
      },
    })
    expect(result.current).toBe(stats)
  })
})
