import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { GeneFilterArgs } from '../models/gene'

interface GeneState {
  filterArgs: GeneFilterArgs
  loading: boolean
  error: string | null
}

const initialState: GeneState = {
  filterArgs: {
    geneIds: [],
    slimTermIds: [],
  },
  loading: false,
  error: null,
}

export const geneSlice = createSlice({
  name: 'gene',
  initialState,
  reducers: {
    setFilterArgs: (state, action: PayloadAction<Partial<GeneFilterArgs>>) => {
      state.filterArgs = { ...state.filterArgs, ...action.payload }
    },
    resetFilterArgs: state => {
      state.filterArgs = initialState.filterArgs
    },
  },
})

export const { setFilterArgs, resetFilterArgs } = geneSlice.actions
