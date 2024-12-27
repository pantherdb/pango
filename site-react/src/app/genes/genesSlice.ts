import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

interface SelectedGeneState {
  geneId: string | null;
}

const initialState: SelectedGeneState = {
  geneId: null,
};

const selectedGeneSlice = createSlice({
  name: 'selectedGene',
  initialState,
  reducers: {
    setGeneId(state, action: PayloadAction<string>) {
      state.geneId = action.payload;
    },
    clearGeneId(state) {
      state.geneId = null;
    },
  },
});

export const { setGeneId, clearGeneId } = selectedGeneSlice.actions;
export default selectedGeneSlice.reducer;