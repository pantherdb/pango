import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

interface SelectedAnnotationState {
  annotationId: string | null;
}

const initialState: SelectedAnnotationState = {
  annotationId: null,
};

const selectedAnnotationSlice = createSlice({
  name: 'selectedAnnotation',
  initialState,
  reducers: {
    setAnnotationId(state, action: PayloadAction<string>) {
      state.annotationId = action.payload;
    },
    clearAnnotationId(state) {
      state.annotationId = null;
    },
  },
});

export const { setAnnotationId, clearAnnotationId } = selectedAnnotationSlice.actions;
export default selectedAnnotationSlice.reducer;