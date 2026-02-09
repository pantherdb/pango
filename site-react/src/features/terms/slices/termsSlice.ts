// termsSlice.ts
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { CategoryTerm, Term } from '../models/term'

interface TermsState {
  functionCategories: CategoryTerm[]
  expandedCategoryId: string | null
  childTerms: Term[]
}

const initialState: TermsState = {
  functionCategories: [],
  expandedCategoryId: null,
  childTerms: [],
}

export const termsSlice = createSlice({
  name: 'terms',
  initialState,
  reducers: {
    setFunctionCategories: (state, action: PayloadAction<CategoryTerm[]>) => {
      state.functionCategories = action.payload
    },
    setExpandedCategory: (state, action: PayloadAction<{ categoryId: string; terms: Term[] }>) => {
      state.expandedCategoryId = action.payload.categoryId
      state.childTerms = action.payload.terms
    },
    clearExpandedCategory: (state) => {
      state.expandedCategoryId = null
      state.childTerms = []
    },
  },
})

export const { setFunctionCategories, setExpandedCategory, clearExpandedCategory } = termsSlice.actions
export default termsSlice.reducer
