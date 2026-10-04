import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { buildCategoryTerm, buildGene } from '@tests/fixtures/builders'
import { buildSearchState } from '@tests/fixtures/state'
import type { RootState } from '@/app/store/store'
import { makeStore } from '@/app/store/store'
import { useSearchFilter } from '@/features/search/useSearch'

const renderFilter = (preloadedState: Partial<RootState>) => {
  const store = makeStore(preloadedState)
  return renderHook(() => useSearchFilter(), {
    wrapper: ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>,
  }).result.current
}

describe('useSearchFilter', () => {
  it('turns the selected filters into the ids the API expects', () => {
    const { filter, isEmpty } = renderFilter({
      search: buildSearchState({ genes: [buildGene()], slimTerms: [buildCategoryTerm()] }),
    })

    expect(filter).toEqual({
      geneIds: ['UniProtKB:P04637'],
      slimTermIds: ['GO:0003824'],
      termIds: [],
    })
    expect(isEmpty).toBe(false)
  })

  it('reports when nothing is selected', () => {
    const { filter, isEmpty } = renderFilter({ search: buildSearchState() })

    expect(filter).toEqual({ geneIds: [], slimTermIds: [], termIds: [] })
    expect(isEmpty).toBe(true)
  })
})
