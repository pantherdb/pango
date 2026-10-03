import type { RootState } from '@/app/store/store'
import { SearchFilterType } from '@/features/search/search'
import { addItem, searchSlice } from '@/features/search/searchSlice'
import { termsSlice } from '@/features/terms/slices/termsSlice'
import type { Gene } from '@/features/genes/models/gene'
import type { CategoryTerm, Term } from '@/features/terms/models/term'

type SearchState = RootState['search']

interface SearchStateInput extends Partial<Omit<SearchState, 'genes' | 'slimTerms' | 'terms'>> {
  genes?: Gene[]
  slimTerms?: CategoryTerm[]
  terms?: Term[]
}

/**
 * Search state built by running the selections through the real reducer, so `filtersCount` and
 * the tooltips always match the selected filters. Other fields can be overridden.
 */
export const buildSearchState = ({
  genes = [],
  slimTerms = [],
  terms = [],
  ...overrides
}: SearchStateInput = {}): SearchState => {
  const actions = [
    ...genes.map(item => addItem({ type: SearchFilterType.GENES, item })),
    ...slimTerms.map(item => addItem({ type: SearchFilterType.SLIM_TERMS, item })),
    ...terms.map(item => addItem({ type: SearchFilterType.TERMS, item })),
  ]
  const state = actions.reduce(searchSlice.reducer, searchSlice.getInitialState())
  return { ...state, ...overrides }
}

export const buildTermsState = (
  overrides: Partial<RootState['terms']> = {}
): RootState['terms'] => ({
  ...termsSlice.getInitialState(),
  ...overrides,
})
