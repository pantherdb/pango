import { describe, expect, it } from 'vitest'
import { makeStore } from '@/app/store/store'
import drawerReducer, {
  drawerSlice,
  selectLeftDrawerOpen,
  selectRightDrawerOpen,
  setLeftDrawerOpen,
  setRightDrawerOpen,
  toggleLeftDrawer,
  toggleRightDrawer,
} from '@/@pango.core/components/drawer/drawerSlice'

describe('drawerSlice', () => {
  it('starts with the filter panel open and the details drawer closed', () => {
    expect(drawerSlice.getInitialState()).toEqual({ leftDrawerOpen: true, rightDrawerOpen: false })
  })

  it('opens, closes and toggles each drawer independently', () => {
    const initial = drawerSlice.getInitialState()

    const leftClosed = drawerReducer(initial, setLeftDrawerOpen(false))
    expect(leftClosed).toEqual({ leftDrawerOpen: false, rightDrawerOpen: false })
    expect(drawerReducer(leftClosed, toggleLeftDrawer()).leftDrawerOpen).toBe(true)

    const rightOpen = drawerReducer(initial, setRightDrawerOpen(true))
    expect(rightOpen).toEqual({ leftDrawerOpen: true, rightDrawerOpen: true })
    expect(drawerReducer(rightOpen, toggleRightDrawer()).rightDrawerOpen).toBe(false)
  })

  it('selects each drawer from the app state', () => {
    const store = makeStore()

    store.dispatch(setLeftDrawerOpen(false))
    store.dispatch(setRightDrawerOpen(true))

    expect(selectLeftDrawerOpen(store.getState())).toBe(false)
    expect(selectRightDrawerOpen(store.getState())).toBe(true)
  })
})
