import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { Annotation } from '../models/annotation'

interface SelectedAnnotationState {
  selectedAnnotation: Annotation | null
}

const initialState: SelectedAnnotationState = {
  selectedAnnotation: null,
}

export const selectedAnnotationSlice = createSlice({
  name: 'selectedAnnotation',
  initialState,
  reducers: {
    setSelectedAnnotation: (state, action: PayloadAction<Annotation | null>) => {
      state.selectedAnnotation = action.payload
    },
  },
})

export const { setSelectedAnnotation } = selectedAnnotationSlice.actions
export default selectedAnnotationSlice.reducer
