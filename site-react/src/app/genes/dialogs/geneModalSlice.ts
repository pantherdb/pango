import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

interface ModalState {
  open: boolean;
  boardId?: string;
  parentId?: string;
  type?: 'text' | 'number' | 'email' | 'tel' | 'url';
}

const initialState: ModalState = {
  open: false,
  boardId: undefined,
  parentId: undefined,
  type: undefined
};

const geneModalSlice = createSlice({
  name: 'geneModal',
  initialState,
  reducers: {
    openGeneModal(state, action: PayloadAction<{
      boardId?: string;
      parentId?: string;
      type?: 'text' | 'number' | 'email' | 'tel' | 'url';
    }>) {
      state.open = true;
      state.boardId = action.payload.boardId;
      state.parentId = action.payload.parentId;
      state.type = action.payload.type;
    },
    closeGeneModal(state) {
      state.open = false;
      state.boardId = undefined;
      state.parentId = undefined;
      state.type = undefined;
    },
  },
});

export const { openGeneModal, closeGeneModal } = geneModalSlice.actions;
export default geneModalSlice.reducer;