# Task: Add Resizable Divider Between Left Panel and Main Content

## Goal
Add a draggable divider between the left filter panel and the main results area on the Home page, so desktop users can adjust the panel widths. Use the already-installed `react-resizable-panels` (v4.6.2) library.

## Current State
- Left panel was a fixed 420px MUI `Drawer` (persistent variant) in `Layout.tsx`
- On mobile (`sm` breakpoint and below), the left panel takes full width — no resize needed
- Open/close controlled by Redux state (`leftDrawerOpen` in `drawerSlice.ts`)
- Only the Home page (`/` route) has a left panel — gene detail, about, and help pages do not
- Right drawer is a `temporary` MUI Drawer (overlay) — not affected by this change

## Implementation Plan

### Phase 1: Replace MUI Drawer with Resizable Panels (Desktop) ✓
- [x] Import `PanelGroup`, `Panel`, `PanelResizeHandle` from `react-resizable-panels` in `Layout.tsx`
- [x] When `leftDrawerContent` exists and `leftDrawerOpen` is true and not mobile:
  - Wrap the left panel + main content in `<PanelGroup direction="horizontal" autoSaveId="left-panel">`
  - Left panel: `<Panel defaultSize={25} minSize={15} maxSize={45}>` containing `leftDrawerContent` directly (no MUI Drawer)
  - Resize handle: `<PanelResizeHandle>` styled as a thin vertical divider
  - Main panel: `<Panel>` containing `<Outlet />` + `<Footer />`
- [x] When `leftDrawerOpen` is false or `leftDrawerContent` is not provided: render only the main content (no `PanelGroup`)
- [x] When mobile: keep existing full-width MUI Drawer behavior (no resize handle)
- [x] Remove MUI `Drawer` for the left panel on desktop (keep it only for mobile)

### Phase 2: Style the Resize Handle ✓
- [x] Style `PanelResizeHandle` as a thin vertical bar (6px / `w-1.5`)
- [x] Add hover effect (`bg-gray-300` → `bg-blue-300`, inner dot `bg-gray-400` → `bg-blue-600`)
- [x] Cursor handled automatically by `react-resizable-panels` (`col-resize`)
- [x] Used Tailwind classes with `group`/`group-hover` for styling

### Phase 3: Verify and Polish ✓
- [x] Run `npm run type-check` — passes with no errors
- [ ] Test drag-to-resize on desktop (manual)
- [ ] Test open/close toggle still works (manual)
- [ ] Test localStorage persistence via `autoSaveId` (manual)
- [ ] Test mobile behavior unchanged (manual)
- [ ] Test other routes (`/gene/:id`, `/about`, `/help`) unaffected (manual)

## Progress Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1 | Complete | 5/5 |
| Phase 2 | Complete | 4/4 |
| Phase 3 | Type-check done, manual testing pending | 1/6 |

## Files to Create/Modify

| File | Action | Status |
|------|--------|--------|
| `src/app/layout/Layout.tsx` | Modify | ✓ Done |

## Files NOT Modified
- `src/@pango.core/components/drawer/drawerSlice.ts` — no state changes needed
- `src/app/layout/LeftDrawer.tsx` — content unchanged
- `src/App.tsx` — routing unchanged
- `src/app/layout/Toolbar.tsx` — hamburger toggle works as-is

## Dependencies
- [x] `react-resizable-panels` v4.6.2 (already installed)

## Blockers
- None

## What Was Done
- Replaced the fixed-width MUI `Drawer` with `PanelGroup`/`Panel`/`PanelResizeHandle` on desktop
- Left panel defaults to 25% width, resizable between 15%-45%
- Resize handle: thin bar with hover highlight and centered dot indicator
- `autoSaveId="left-panel"` persists panel sizes to localStorage automatically
- Mobile behavior preserved exactly (full-width MUI Drawer)
- Removed unused `drawerWidth` constant
- Drawer open/close toggle continues to work — when closed, `PanelGroup` is not rendered

## Next Steps
1. Manual testing in browser (`npm run dev`)
