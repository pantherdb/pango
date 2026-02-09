# Task: Editable Browser Tab Title

**Branch name:** `feature/editable-tab-title`

**Source:** PAN-GO user feedback

## Goal

Allow users to rename the browser tab title so they can distinguish between multiple open PAN-GO tabs (e.g., different gene search results). This is especially important on the **Search Results page** (`Genes.tsx`) where users frequently run multiple searches in separate tabs.

## Current State

- [x] `useDocumentTitle` hook created in `src/shared/hooks/useDocumentTitle.ts`
- [x] Gene detail page (`Gene.tsx`) auto-sets title to `{geneSymbol} - PAN-GO`
- [x] `RenameTabDialog` component created in `src/shared/components/RenameTabDialog.tsx`
- [x] Ellipsis menu added to Genes.tsx results header with "Tab: PAN-GO Results" item
- [x] Clicking menu item opens rename dialog, updates menu text and browser tab after rename

## Feature Design

### Two-part approach:

**Part A - Automatic dynamic titles (baseline)** ✓
Set `document.title` automatically based on the current page/context:
- Home: `PAN-GO - Human Functionome`
- Gene detail page: `BRCA1 - PAN-GO` (using gene symbol)
- About: `About - PAN-GO`
- Help: `Help - PAN-GO`

**Part B - User-editable title via ellipsis menu (Search Results page)** ✓
- Ellipsis icon (⋮) in the results header bar, next to "Open Filter" button
- Opens a dropdown menu with a single item: `Tab: PAN-GO Results`
- Clicking the menu item opens a rename dialog
- After renaming, the menu item text updates to reflect the new name
- Browser tab title is also updated

## Implementation Plan

### Phase 1: Automatic Dynamic Titles
- [x] Create `useDocumentTitle` custom hook in `src/shared/hooks/`
- [x] Apply to Gene detail page: set title to `{geneSymbol} - PAN-GO`
- [ ] Apply to About page: `About - PAN-GO`
- [ ] Apply to Help page: `Help - PAN-GO`
- [ ] Home page keeps default or sets `PAN-GO - Human Functionome`

### Phase 2: Editable Title UI (Search Results Page)
- [x] Add ellipsis menu icon (FiMoreVertical) to results header in Genes.tsx
- [x] Menu contains "Tab: {tabName}" item showing current tab name
- [x] Clicking item opens RenameTabDialog pre-filled with current name
- [x] On confirm, update both `document.title` and menu item text
- [x] On cancel (Escape or Cancel button), close dialog without changes

### Phase 3: Polish & Extras (Future / Nice-to-have)
- [ ] Persist custom title in sessionStorage so it survives page refresh
- [ ] Include custom title in export filenames (when export feature exists)
- [ ] Add more options to the ellipsis menu as needed

## Progress Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Auto Titles | In Progress | 2/5 |
| Phase 2: Editable UI | Done | 5/5 |
| Phase 3: Polish | Not Started | 0/3 |

## Files Created/Modified

| File | Action | Purpose | Status |
|------|--------|---------|--------|
| `src/shared/hooks/useDocumentTitle.ts` | Created | Custom hook for dynamic document.title | Done |
| `src/shared/components/RenameTabDialog.tsx` | Created | Dialog for renaming browser tab | Done |
| `src/features/genes/components/Genes.tsx` | Modified | Ellipsis menu with rename tab option | Done |
| `src/app/Gene.tsx` | Modified | Auto title via useDocumentTitle hook | Done |
| `src/app/Home.tsx` | Pending | Set default title on mount | Pending |
| `src/app/About.tsx` | Pending | Set "About - PAN-GO" title | Pending |
| `src/app/Help.tsx` | Pending | Set "Help - PAN-GO" title | Pending |

## Open Questions

1. **Scope**: Should the ellipsis menu with rename also appear on Gene detail pages?
2. **Persistence**: Should custom titles survive page refresh (sessionStorage) or be ephemeral?
3. **Auto titles for remaining pages**: Should About/Help/Home get auto titles in this PR or a follow-up?
