// termsSlice.ts
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { CategoryTerm } from '../models/term'

interface TermsState {
  functionCategories: CategoryTerm[]
}

const initialState: TermsState = {
  functionCategories: [],
}

export const termsSlice = createSlice({
  name: 'terms',
  initialState,
  reducers: {
    setFunctionCategories: (state, action: PayloadAction<CategoryTerm[]>) => {
      state.functionCategories = action.payload
    },
  },
})

export const { setFunctionCategories } = termsSlice.actions
export default termsSlice.reducer
