import { describe, expect, it } from 'vitest'
import { buildCategoryTerm, buildGene, buildTerm } from '@tests/fixtures/builders'
import { buildSearchState } from '@tests/fixtures/state'
import { SearchFilterType } from '@/features/search/search'
import searchReducer, {
  addItem,
  clearSearch,
  removeItem,
  setPageSize,
  setSearchType,
} from '@/features/search/searchSlice'

describe('searchSlice', () => {
  it('adds a filter once and returns to the first page', () => {
    const gene = buildGene()
    const start = buildSearchState({ pagination: { page: 3, size: 20 } })

    const once = searchReducer(start, addItem({ type: SearchFilterType.GENES, item: gene }))
    const twice = searchReducer(once, addItem({ type: SearchFilterType.GENES, item: gene }))

    expect(twice.genes).toEqual([gene])
    expect(twice.filtersCount).toBe(1)
    expect(once.pagination.page).toBe(0)
  })

  it('removes genes by gene id and terms by term id', () => {
    const state = buildSearchState({ genes: [buildGene()], terms: [buildTerm()] })

    const withoutGene = searchReducer(
      state,
      removeItem({ type: SearchFilterType.GENES, id: 'UniProtKB:P04637' })
    )
    const withoutTerm = searchReducer(
      withoutGene,
      removeItem({ type: SearchFilterType.TERMS, id: 'GO:0005515' })
    )

    expect(withoutGene.genes).toEqual([])
    expect(withoutTerm.terms).toEqual([])
    expect(withoutTerm.filtersCount).toBe(0)
  })

  it('lists each selected filter on its own tooltip line', () => {
    const state = buildSearchState({
      slimTerms: [
        buildCategoryTerm(),
        buildCategoryTerm({
          id: 'GO:0005215',
          label: 'transporter activity',
          displayId: 'GO:0005215',
        }),
      ],
    })

    expect(state.tooltips.slimTerms).toBe(
      'catalytic activity (GO:0003824)\ntransporter activity (GO:0005215)'
    )
  })

  it('clears the filters but keeps the search type', () => {
    const state = searchReducer(
      buildSearchState({ genes: [buildGene()] }),
      setSearchType('annotations_group')
    )

    const cleared = searchReducer(state, clearSearch())

    expect(cleared.filtersCount).toBe(0)
    expect(cleared.type).toBe('annotations_group')
  })

  it('returns to the first page when the page size changes', () => {
    const state = buildSearchState({ pagination: { page: 2, size: 20 } })

    expect(searchReducer(state, setPageSize(50)).pagination).toEqual({ page: 0, size: 50 })
  })
})
