import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { GeneFilterArgs, GeneStats } from './models/gene';

interface GeneState {
  filterArgs: GeneFilterArgs;
  stats: GeneStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: GeneState = {
  filterArgs: {
    geneIds: [],
    slimTermIds: []
  },
  stats: null,
  loading: false,
  error: null
};

const geneSlice = createSlice({
  name: 'gene',
  initialState,
  reducers: {
    setFilterArgs: (state, action: PayloadAction<Partial<GeneFilterArgs>>) => {
      state.filterArgs = { ...state.filterArgs, ...action.payload };
    },
    resetFilterArgs: (state) => {
      state.filterArgs = initialState.filterArgs;
    },
    setStats: (state, action: PayloadAction<GeneStats>) => {
      state.stats = action.payload;
    }
  }
});

export const { setFilterArgs, resetFilterArgs, setStats } = geneSlice.actions;
export default geneSlice.reducer;