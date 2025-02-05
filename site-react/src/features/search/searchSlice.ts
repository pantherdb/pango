import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { SearchFilterType } from './search'
import type { Gene } from '../genes/models/gene'
import type { CategoryTerm, Term } from '../terms/models/term'

type SearchStateMap = {
  [SearchFilterType.SLIM_TERMS]: CategoryTerm[]
  [SearchFilterType.GENES]: Gene[]
}

interface SearchState extends SearchStateMap {
  filtersCount: number
  type: 'annotations' | 'annotations_group'
  tooltips: {
    slimTerms: string
    genes: string
  }
  pagination: {
    page: number
    size: number
  }
}

const initialState: SearchState = {
  slimTerms: [],
  genes: [],
  filtersCount: 0,
  type: 'annotations',
  tooltips: {
    slimTerms: '',
    genes: '',
  },
  pagination: {
    page: 0,
    size: 20,
  },
}

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<{ type: SearchFilterType; item: Term | Gene }>) => {
      const { type, item } = action.payload
      const list = state[type] as any[]
      const isDuplicate =
        type === SearchFilterType.GENES
          ? list.some(existing => existing.gene === (item as Gene).gene)
          : list.some(existing => existing.id === (item as Term).id)

      if (!isDuplicate) {
        list.push(item)
        state.pagination.page = 0
        updateFiltersAndTooltips(state)
      }
    },

    removeItem: (state, action: PayloadAction<{ type: SearchFilterType; id: string }>) => {
      const { type, id } = action.payload

      if (type === SearchFilterType.GENES) {
        state[type] = state[type].filter(item => item.gene !== id)
      } else {
        state[type] = state[type].filter(item => item.id !== id)
      }
      state.pagination.page = 0

      updateFiltersAndTooltips(state)
    },

    clearSearch: state => {
      return { ...initialState, type: state.type }
    },

    setSearchType: (state, action: PayloadAction<SearchState['type']>) => {
      state.type = action.payload
    },

    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload
    },

    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.size = action.payload
      state.pagination.page = 0
    },
  },
})

const updateFiltersAndTooltips = (state: SearchState) => {
  state.tooltips = {
    slimTerms: state.slimTerms.map(term => `${term.label} (${term.displayId})`).join('\n'),
    genes: state.genes.map(item => `${item.gene} (${item.geneSymbol})${item.geneName}`).join('\n'),
  }
  state.filtersCount = state.slimTerms.length + state.genes.length
}

export const { addItem, removeItem, clearSearch, setSearchType, setPage, setPageSize } =
  searchSlice.actions
export default searchSlice.reducer
