import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { FilterArgs, AnnotationStats } from '../models/annotation'

interface AnnotationState {
  filterArgs: FilterArgs
  stats: AnnotationStats | null
  loading: boolean
  error: string | null
}

const initialState: AnnotationState = {
  filterArgs: {
    termIds: [],
    termTypeIds: [],
    slimTermIds: [],
    evidenceTypeIds: [],
    geneIds: [],
    aspectIds: [],
    withGeneIds: [],
    referenceIds: [],
  },
  stats: null,
  loading: false,
  error: null,
}

export const annotationSlice = createSlice({
  name: 'annotation',
  initialState,
  reducers: {
    setFilterArgs: (state, action: PayloadAction<Partial<FilterArgs>>) => {
      state.filterArgs = { ...state.filterArgs, ...action.payload }
    },
    resetFilterArgs: state => {
      state.filterArgs = initialState.filterArgs
    },
    setStats: (state, action: PayloadAction<AnnotationStats>) => {
      state.stats = action.payload
    },
  },
})

export const { setFilterArgs, resetFilterArgs, setStats } = annotationSlice.actions
export default annotationSlice.reducer
