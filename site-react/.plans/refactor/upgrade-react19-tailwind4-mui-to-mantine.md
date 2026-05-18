# Task: Upgrade React 18→19, Tailwind 3→4, and migrate MUI → Mantine v9

**Status:** ACTIVE
**Issue:** N/A (internal modernization)
**Branch:** `refactor/upgrade-react19-tailwind4-mantine` (to be created from `update-framework-n-lib`)

## Goal

Bring `site-react` to the stack already documented in [docs/dev-guide-react.md](../../docs/dev-guide-react.md): **React 19 + Tailwind v4 + Mantine v9** (replacing MUI). Done = all pages render & behave the same, `npm run build`, `npm run type-check`, `npm run lint`, and `npm run test` all pass, and `@mui/*` + `@emotion/*` are removed from `package.json`.

## Context

- **Current stack** (per [package.json](../../package.json)):
  - `react@^18.2.0`, `react-dom@^18.2.0`, `@types/react@^18.2.47`
  - `tailwindcss@^3.4.4` (+ `autoprefixer`, `postcss`, `prettier-plugin-tailwindcss@^0.6.11`)
  - `@mui/material@^5.15.20`, `@mui/icons-material`, `@mui/base`, `@mui/system`, `@mui/utils`, `@emotion/react`, `@emotion/styled`
- **Target stack** (per [docs/dev-guide-react.md](../../docs/dev-guide-react.md)):
  - React 19 + Vite + TypeScript
  - Mantine v9 (controls + shell)
  - Tailwind v4 (utility classes only — no layout components from Mantine for simple flex/grid)
- **MUI footprint:** 25 files import from `@mui/*`. See "MUI Import Surface" below for the full list.
- **Why this order:** React first (foundational, low surface area in our code), Tailwind second (build-pipeline change, isolated to CSS), Mantine third (largest diff — best done on a stable React+Tailwind base).

## Current State

**What works now:**
- Build, type-check, lint, tests all green on React 18 / Tailwind 3 / MUI 5.
- Theme is centralized in `src/@pango.core/theme/theme.ts` (MUI `createTheme`) with `pangoColors` exported and reused by `tailwind.config.js`.
- `prettier-plugin-tailwindcss` orders Tailwind classes.

**What's broken/missing for the target:**
- Nothing is broken — this is a planned modernization. Dev guide describes a stack that does not yet match the code.

## MUI Import Surface (25 files)

Captured via `grep -r "from '@mui/" src/`. Components to translate:

| MUI Import | Files | Mantine Equivalent |
|---|---|---|
| `Button`, `IconButton` | `IconButton.tsx`, `LeftDrawer.tsx`, `RightDrawer.tsx`, `Toolbar.tsx`, `CategoryStats.tsx`, `VersionedButton.tsx`, `RenameTabDialog.tsx`, `Genes.tsx` | `Button`, `ActionIcon` |
| `Tooltip` | `AnnotationTable.tsx`, `ChildTermFilterDisplay.tsx`, `TermAutocompleteForm.tsx`, `TermFilterForm.tsx`, `Terms.tsx`, `FilterSummary.tsx`, `GeneForm.tsx`, `Genes.tsx`, `CategoryStats.tsx`, `LeftDrawer.tsx` | `Tooltip` |
| `Chip` | `ChildTermFilterDisplay.tsx`, `TermAutocompleteForm.tsx`, `TermFilterForm.tsx`, `FilterSummary.tsx`, `GeneForm.tsx` | `Badge` or `Pill` |
| `Autocomplete` + `TextField` | `TermAutocompleteForm.tsx`, `TermFilterForm.tsx`, `GeneForm.tsx`, `GeneSearch.tsx`, `RenameTabDialog.tsx` | `MultiSelect` / `Autocomplete` / `TextInput` |
| `Dialog*` (Dialog/Title/Content/Actions) | `RenameTabDialog.tsx` | `Modal` |
| `Menu`, `MenuItem`, `Popper`, `ClickAwayListener` | `Toolbar.tsx`, `Genes.tsx`, `GeneSearch.tsx` | `Menu` / `Popover` (click-away built-in) |
| `Drawer` | `Layout.tsx` | `Drawer` (Mantine) or `AppShell` |
| `Paper` | `Toolbar.tsx`, `TermAutocompleteForm.tsx`, `GeneSearch.tsx` | `Paper` (Mantine) |
| `Box` | `Home.tsx`, `Layout.tsx` | Plain `<div>` + Tailwind (per project policy) |
| `CircularProgress`, `LinearProgress` | `GeneSearch.tsx`, `Genes.tsx`, `Toolbar.tsx` | `Loader`, `Progress` |
| `TablePagination` | `Genes.tsx` | `Pagination` (Mantine) |
| `Checkbox` | `CategoryStats.tsx` | `Checkbox` |
| `useMediaQuery`, `useTheme` | `Home.tsx`, `Gene.tsx`, `LeftDrawer.tsx`, `Toolbar.tsx`, `Layout.tsx`, `Genes.tsx`, `GeneSummary.tsx` | `useMediaQuery` (`@mantine/hooks`), `useMantineTheme` |
| `CssBaseline` + `ThemeProvider` | `App.tsx` | `MantineProvider` |
| `createTheme`, theme overrides | `theme.ts`, `theme/components/*.ts` | Mantine `createTheme` + `theme` overrides |

## Steps

### Phase 1: React 18 → 19 ✓ DONE

- [x] Stayed on existing branch `update-framework-n-lib` (no new branch).
- [x] Bumped: `react@^19`, `react-dom@^19`, `@types/react@^19`, `@types/react-dom@^19`, `@testing-library/react@^16`, `@testing-library/dom@^10.4.0` — `@vitejs/plugin-react@^4.3.4` already supports React 19.
- [x] `npm install` — installed React 19.2.6.
- [x] `npm run type-check` — clean, no typing fallout (no `forwardRef`/`defaultProps`/`PropTypes` in codebase; `React.FC` usages all type children explicitly via Props types).
- [x] `npm run build` — green.
- [x] `npm run test` — 3 failures, all in `Home.test.tsx`; root-caused to pre-existing test-fixture-vs-source-shape mismatch (`search.terms` undefined in fixture). Not a React 19 regression.
- [x] MUI v5 continues to render under React 19 (build succeeded with `@mui/material@5.16.14`).

### Phase 2: Tailwind 3 → 4 ✓ DONE

- [x] Installed `tailwindcss@^4` + `@tailwindcss/vite@^4`; removed `autoprefixer` + `postcss` (v4 ships its own pipeline).
- [x] Bumped `prettier-plugin-tailwindcss` to `^0.6.14` for v4-aware class ordering.
- [x] Added `tailwindcss()` plugin to `vite.config.ts` (between `react()` and `tsChecker()`).
- [x] Deleted `postcss.config.cjs`.
- [x] Rewrote `src/index.css`: replaced `@tailwind base/components/utilities` with `@import 'tailwindcss';` and added an `@theme` block carrying the full `pangoColors` palettes (primary 50-900, accent 50-900) and the `2xs` text size.
- [x] Cleaned `src/styles/app-components.css` (removed orphaned `@tailwind components`).
- [x] Deleted `tailwind.config.js` (no more JS config — palette lives in CSS).
- [x] Audited utility-class breakage: no usages of `bg-opacity-*`, `text-opacity-*`, `flex-grow-*`, `decoration-clone`, `shadow-outline` — clean.
- [x] `@apply` directives (`text-blue-800`, `text-primary-300`, `border-accent-700`, etc.) all still resolve — verified by checking compiled CSS contains all the relevant color variants.
- [x] `npm run build` green; CSS bundle 28.18 kB → 39.72 kB (expected — v4's `@import "tailwindcss"` includes preflight + utilities more fully).
- [x] `npm run type-check` clean; lint errors are all pre-existing unused-vars (logged above).
- [x] Setup verified against working reference at `C:\work\panther\annotations\go-pango-annotations-trials\c-site` — identical structure.

### Phase 3: MUI → Mantine v9 (largest phase — sub-phases below)

#### 3a. Install + set up Mantine

- [ ] Install:
  - `npm i @mantine/core@^9 @mantine/hooks@^9 @mantine/form@^9 @mantine/notifications@^9`
  - `npm i -D postcss postcss-preset-mantine postcss-simple-vars` (Mantine v9 uses PostCSS for its component CSS)
  - Note: Mantine's PostCSS pipeline is independent of Tailwind v4's CSS engine; both can coexist. Add a minimal `postcss.config.cjs` back **only** for Mantine's preset (this is the standard Mantine setup).
- [ ] Create `postcss.config.cjs`:
  ```js
  module.exports = {
    plugins: { 'postcss-preset-mantine': {}, 'postcss-simple-vars': { variables: { 'mantine-breakpoint-xs': '36em', 'mantine-breakpoint-sm': '48em', 'mantine-breakpoint-md': '62em', 'mantine-breakpoint-lg': '75em', 'mantine-breakpoint-xl': '88em' } } },
  }
  ```
  Confirm Tailwind v4 still works alongside this — `@tailwindcss/vite` is its own plugin; the PostCSS file is consumed only by files that aren't handled by `@tailwindcss/vite`. If there is a conflict, switch Tailwind back to PostCSS mode (`@tailwindcss/postcss`) and consolidate.
- [ ] Import Mantine styles in [src/main.tsx](../../src/main.tsx) (or [src/index.css](../../src/index.css)):
  ```ts
  import '@mantine/core/styles.css'
  import '@mantine/notifications/styles.css'
  ```
- [ ] Wrap app with `<MantineProvider theme={pangoTheme}>` in [App.tsx](../../src/App.tsx) (alongside or replacing `ThemeProvider`/`CssBaseline` — see step 3b).

#### 3b. Build the Mantine theme

- [ ] Create `src/@pango.core/theme/mantineTheme.ts` that mirrors today's MUI theme:
  - `colors: { primary: tupleOf10(pangoColors.pangodark), accent: tupleOf10(pangoColors.pangoAccent) }`
  - `primaryColor: 'primary'`
  - `fontFamily: '...'` (match current `body` font-stack from index.css)
  - `defaultRadius`, `headings`, `components.Button.defaultProps`, `components.Dialog.defaultProps` translated from `theme/components/ButtonTheme.ts` and `theme/components/DialogTheme.ts`.
- [ ] Keep [src/@pango.core/theme/theme.ts](../../src/@pango.core/theme/theme.ts) exporting `pangoColors` (Tailwind config and Mantine theme both read it). Drop the MUI `createTheme` call once nothing imports it.

#### 3c. Migrate components, leaf-first

Order matters — migrate leaves before parents to keep diffs small. After each cluster, run `npm run dev` and click through the affected pages.

- [ ] **Cluster 1 — Simple primitives (Tooltip, Chip, Button, IconButton):**
  - [ ] `src/@pango.core/components/IconButton.tsx` (custom wrapper — convert to Mantine `ActionIcon`)
  - [ ] `src/shared/components/VersionedButton.tsx`
  - [ ] `src/shared/components/CategoryStats.tsx` (Tooltip, Checkbox, Button)
  - [ ] `src/features/search/components/FilterSummary.tsx` (Chip, Tooltip)
  - [ ] `src/features/terms/components/Terms.tsx` (Tooltip)
  - [ ] `src/features/terms/components/ChildTermFilterDisplay.tsx` (Chip, Tooltip)
  - [ ] `src/features/annotations/components/AnnotationTable.tsx` (Tooltip)
- [ ] **Cluster 2 — Forms (Autocomplete / TextField / Chip):**
  - [ ] `src/features/genes/components/forms/GeneForm.tsx`
  - [ ] `src/features/terms/components/TermAutocompleteForm.tsx`
  - [ ] `src/features/terms/components/TermFilterForm.tsx`
  - [ ] `src/features/genes/components/GeneSearch.tsx` (Autocomplete + Popper + ClickAwayListener → Mantine `Autocomplete` or `Combobox`)
  - [ ] `src/shared/components/RenameTabDialog.tsx` (Dialog → `Modal`, TextField → `TextInput`)
- [ ] **Cluster 3 — Layout / chrome:**
  - [ ] `src/app/layout/Toolbar.tsx` (Menu/Popper/ClickAwayListener/Paper/IconButton/LinearProgress)
  - [ ] `src/app/layout/LeftDrawer.tsx` (Button, Tooltip, useMediaQuery)
  - [ ] `src/app/layout/RightDrawer.tsx` (Button)
  - [ ] `src/app/layout/Layout.tsx` (Drawer, Box, useMediaQuery, useTheme) — consider `AppShell` here per dev guide §3.
- [ ] **Cluster 4 — Pages:**
  - [ ] `src/app/Home.tsx` (Box, useMediaQuery)
  - [ ] `src/app/Gene.tsx` (useMediaQuery from `@mui/system`)
  - [ ] `src/features/genes/components/Genes.tsx` (CircularProgress, Button, Tooltip, TablePagination, Menu/MenuItem, useTheme, useMediaQuery)
  - [ ] `src/features/genes/components/GeneSummary.tsx` (useTheme, useMediaQuery)
- [ ] **Cluster 5 — Theme + app shell:**
  - [ ] `src/App.tsx` — drop `ThemeProvider` (from `@emotion/react`) and `CssBaseline`; keep only `MantineProvider`.
  - [ ] `src/@pango.core/theme/theme.ts` — keep `pangoColors`, drop MUI `createTheme`.
  - [ ] `src/@pango.core/theme/index.ts` — delete (was MUI-specific `componentThemes`).
  - [ ] `src/@pango.core/theme/components/DialogTheme.ts` / `ButtonTheme.ts` — delete (folded into `mantineTheme.ts`).

#### 3d. Remove MUI

- [ ] `npm uninstall @mui/material @mui/icons-material @mui/base @mui/system @mui/utils @emotion/react @emotion/styled`
- [ ] Update `manualChunks` in [vite.config.ts](../../vite.config.ts):
  - Drop the `'mui'` chunk; add `if (id.includes('@mantine')) return 'mantine'` if bundle size warrants.
- [ ] Grep the repo for any leftover `@mui/`, `@emotion/`, `ThemeProvider` from emotion. Should be zero.
- [ ] `npm run build`, `npm run type-check`, `npm run lint`, `npm run test`. All green.
- [ ] **Commit:** `refactor: migrate MUI → Mantine v9`.

### Phase 4: Verification

- [ ] Manual smoke test of every page and major interaction:
  - Home (search box, suggested genes)
  - Gene detail page (right drawer, annotation table, term filters)
  - Genes results page (filters, child-term display, ellipsis menu rename-tab dialog, pagination)
  - About, Help
  - Toolbar menus, left drawer, version button
- [ ] Visual diff vs. main branch (screenshots side-by-side for at least the two main pages).
- [ ] Bundle-size check: `dist/stats-treemap.html` — expect MUI chunk gone, Mantine smaller than the old MUI footprint.
- [ ] Open PR; reference this plan in the description.

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** Phases 1 and 2 done on branch `update-framework-n-lib`. React 19.2.6 + Tailwind v4.3.0 installed; `tailwind.config.js` and `postcss.config.cjs` deleted; `src/index.css` rewritten with `@import "tailwindcss"` + `@theme` block carrying `pangoColors`; `src/styles/app-components.css` cleaned of `@tailwind components`; `@tailwindcss/vite` plugin wired into `vite.config.ts`. Build + type-check green. Setup matches reference site at `C:\work\panther\annotations\go-pango-annotations-trials\c-site`.
- **Next immediate action:** Begin Phase 3 (MUI → Mantine v9). Start with 3a (install Mantine + Tabler icons, set up `MantineProvider`).
- **Recent commands run:**
  - `npm install` (twice — once for React 19, once for Tailwind v4)
  - `npm run type-check`, `npm run build`, `npm run lint`, `npm run test`
- **Uncommitted changes:** `package.json`, `package-lock.json`, `vite.config.ts`, `src/index.css`, `src/styles/app-components.css`, deleted `tailwind.config.js`, deleted `postcss.config.cjs`. Plus new plan file at `.plans/refactor/upgrade-react19-tailwind4-mui-to-mantine.md`.
- **Environment state:** Tailwind v4 ships with built-in autoprefixer, so `autoprefixer` + `postcss` are gone from `devDependencies`. Reference site uses `@tabler/icons-react` paired with Mantine — note this for Phase 3.

## Pre-existing Issues (Found During Upgrade)

These are NOT caused by Phase 1 or 2 and don't need to be fixed in this branch — flagging for visibility:

- **3 failing tests in `src/test/__tests__/Home.test.tsx`**: the test's `initialState.search` fixture is missing `terms: []` and `tooltips.terms`, but `Home.tsx:32` does `search.terms.map(...)`. The search slice's `SearchStateMap` requires `terms: Term[]`. Update the test fixture (or accept the failure) when Phase 3 touches Home.tsx.
- **15 lint errors** (all `@typescript-eslint/no-unused-vars`) across `Home.tsx`, `NavButton.tsx`, `VersionBanner.tsx`, `AnnotationDetails.tsx`, `GeneSearch.tsx`, `Genes.tsx`, `TermAutocompleteForm.tsx`, `TermFilterForm.tsx` — unused imports/state-setters left behind from prior changes. Plus one ESLint config error: `vite.config.ts` not in `tsconfig.app.json`. Pre-existing.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| —              | —             | —    |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `package.json` | Bump React/Tailwind, swap MUI→Mantine | Pending |
| `package-lock.json` | Regenerated | Pending |
| `vite.config.ts` | Add `@tailwindcss/vite`; update `manualChunks` | Pending |
| `postcss.config.cjs` | Delete then re-add for Mantine preset | Pending |
| `tailwind.config.js` | Delete (theme moves to `@theme` in CSS) | Pending |
| `src/index.css` | Switch to `@import "tailwindcss"`; add `@theme` block; add Mantine style imports | Pending |
| `src/main.tsx` | Add Mantine CSS imports (alternative location) | Pending |
| `src/App.tsx` | Replace MUI `ThemeProvider`/`CssBaseline` with `MantineProvider` | Pending |
| `src/@pango.core/theme/theme.ts` | Drop MUI `createTheme`; keep `pangoColors` only | Pending |
| `src/@pango.core/theme/index.ts` | Delete | Pending |
| `src/@pango.core/theme/components/ButtonTheme.ts` | Delete (folded into Mantine theme) | Pending |
| `src/@pango.core/theme/components/DialogTheme.ts` | Delete (folded into Mantine theme) | Pending |
| `src/@pango.core/theme/mantineTheme.ts` | **Create** | Pending |
| 25 MUI-consumer files (see "MUI Import Surface") | Migrate imports + JSX | Pending |

## Blockers

- None currently.

## Notes

- **MUI v5 vs. React 19:** MUI v5.15+ is compatible with React 19 (verified via MUI's official release notes). No need to first upgrade MUI to v6 before removing it.
- **Tailwind v4 + Mantine coexistence:** Mantine v9 expects PostCSS with `postcss-preset-mantine`. Tailwind v4's `@tailwindcss/vite` plugin is independent of the PostCSS chain, so both can run side-by-side. If a conflict surfaces, fall back to `@tailwindcss/postcss` and keep one consolidated `postcss.config.cjs`.
- **Per-phase commits:** Keep React, Tailwind, and Mantine in separate commits so a regression bisect points cleanly at the responsible upgrade.
- **`prettier-plugin-tailwindcss`:** Needs a bump for Tailwind v4 class detection — check release notes at upgrade time.
- **`useMediaQuery` from `@mui/system`** in `src/app/Gene.tsx` is a slightly different import path than the rest of the codebase — easy to miss when grepping for `@mui/material`.
- **Mantine icons:** We currently use both `@mui/icons-material` and `react-icons`. Standardize on `react-icons` (already a dep) or add `@tabler/icons-react` (Mantine's typical pairing). Decision deferred — easiest is to migrate any `@mui/icons-material` usages to `react-icons` equivalents during cluster migration.

## Lessons Learned

<!-- Fill during and after task. -->

## Additional Context (Claude)

### Risks I'd flag up front

1. **`Autocomplete` semantics differ between MUI and Mantine.** MUI's `Autocomplete` with `multiple` + `freeSolo` is a near-exact match for Mantine's `TagsInput`; non-multiple `Autocomplete` maps to Mantine's `Autocomplete` or `Combobox`. The forms in `GeneForm.tsx` / `TermFilterForm.tsx` will need careful porting — they likely rely on MUI's `renderTags` / `renderInput` slots that Mantine handles via different props. **Plan to test these forms thoroughly.**
2. **`Popper` + `ClickAwayListener` patterns** in `Toolbar.tsx` and `GeneSearch.tsx` are MUI idioms; Mantine `Popover` / `Menu` ship click-outside behavior built-in, so this should *simplify* the code — but watch for keyboard-handler differences (Escape, Tab cycling).
3. **`TablePagination`** in `Genes.tsx` — Mantine's `Pagination` is page-number-only; if we currently expose rows-per-page selection, we'll need to build a small composite (`Pagination` + `Select`) to match.
4. **Theme overrides in `ButtonTheme.ts` / `DialogTheme.ts`** need a careful read before deleting — any custom border-radius, padding, or color overrides must translate to Mantine's `theme.components.Button` defaultProps/styles.
5. **`@emotion/react`** is also imported in [App.tsx](../../src/App.tsx) (`import { ThemeProvider } from '@emotion/react'`). After removing MUI we can drop both `@emotion/react` and `@emotion/styled` — verify no transitive use first.

### Alternative orderings I considered

- **Mantine first, then upgrades:** Tempting because the dev guide pushes Mantine hardest, but doing the largest migration on an older React/Tailwind means redoing work if either upgrade breaks Mantine components.
- **All three in one PR:** Higher risk; harder to bisect; harder to review. The three-commit plan above keeps the PR reviewable.

### Suggestion for the codebase

While migrating, consider extracting common patterns (e.g. the rename-tab dialog flow, the autocomplete chip patterns) into `src/shared/components/` so the per-feature files become thinner. Don't do this *in* the upgrade PR — flag follow-ups in the PR description so the diff stays scoped to "MUI → Mantine".
