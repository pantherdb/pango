import type { RootState } from '@/app/store/store'
import { createSlice } from '@reduxjs/toolkit'

interface DrawerState {
  leftDrawerOpen: boolean
  rightDrawerOpen: boolean
}

const initialState: DrawerState = {
  leftDrawerOpen: true,
  rightDrawerOpen: false,
}

export const drawerSlice = createSlice({
  name: 'drawer',
  initialState,
  reducers: {
    setLeftDrawerOpen: (state, action) => {
      state.leftDrawerOpen = action.payload
    },
    setRightDrawerOpen: (state, action) => {
      state.rightDrawerOpen = action.payload
    },
    toggleLeftDrawer: state => {
      state.leftDrawerOpen = !state.leftDrawerOpen
    },
    toggleRightDrawer: state => {
      state.rightDrawerOpen = !state.rightDrawerOpen
    },
  },
})

export const { setLeftDrawerOpen, setRightDrawerOpen, toggleLeftDrawer, toggleRightDrawer } =
  drawerSlice.actions

export const selectLeftDrawerOpen = (state: RootState) => state.drawer.leftDrawerOpen
export const selectRightDrawerOpen = (state: RootState) => state.drawer.rightDrawerOpen

export default drawerSlice.reducer
