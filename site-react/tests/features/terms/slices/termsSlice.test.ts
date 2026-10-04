import { describe, expect, it } from 'vitest'
import { buildCategoryTerm, buildTerm } from '@tests/fixtures/builders'
import termsReducer, {
  clearExpandedCategory,
  setExpandedCategory,
  setFunctionCategories,
  termsSlice,
} from '@/features/terms/slices/termsSlice'

describe('termsSlice', () => {
  it('starts with no categories and nothing expanded', () => {
    expect(termsSlice.getInitialState()).toEqual({
      functionCategories: [],
      expandedCategoryId: null,
      childTerms: [],
    })
  })

  it('stores the function categories for the graph', () => {
    const categories = [buildCategoryTerm(), buildCategoryTerm({ id: 'GO:0005215' })]

    const state = termsReducer(termsSlice.getInitialState(), setFunctionCategories(categories))

    expect(state.functionCategories).toEqual(categories)
  })

  it('expands one category with its child terms and collapses it again', () => {
    const childTerms = [buildTerm({ id: 'GO:0004672', label: 'protein kinase activity' })]

    const expanded = termsReducer(
      termsSlice.getInitialState(),
      setExpandedCategory({ categoryId: 'GO:0003824', terms: childTerms })
    )
    expect(expanded.expandedCategoryId).toBe('GO:0003824')
    expect(expanded.childTerms).toEqual(childTerms)

    const collapsed = termsReducer(expanded, clearExpandedCategory())
    expect(collapsed.expandedCategoryId).toBeNull()
    expect(collapsed.childTerms).toEqual([])
  })
})
