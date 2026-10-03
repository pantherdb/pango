# Task: Harden the MUI → Mantine migration (bugs, CSS layering, theme, tests, tooling)

**Status:** COMPLETE
**Issue:** N/A (follow-up to `.plans/refactor/upgrade-react19-tailwind4-mui-to-mantine.md`, commit `6042381`)
**Branch:** `update-framework-n-lib`

## Goal

The Mantine migration is correct, idiomatic and verifiably green: no behaviour or a11y regressions,
Mantine + Tailwind v4 share one cascade without `!important` hacks, the theme is token-driven,
`npm run type-check` / `lint` / `test` / `build` really check the code and all pass, tests cover what
the migration rewrote, and the docs describe the stack we actually run. VPE
(`C:\work\go\noctua-visual-pathway-editor`) is a reference only — never modified.

## Context

- **Triggered by:** review of commit `6042381` against VPE (user request: "fix it, write a plan and
  implement, only the site code … improve it so it is the best").
- **Scope:** `site-react/` only. Other folders (`api/`, `loader/`) have unrelated uncommitted work from
  another session — never stage, stash, reset or edit them.

## Current State (before this task)

- **Bugs introduced by the migration:** GeneSearch ignored `popoverRef`/`onClose` (search never closed on
  click-away); "Clear All Filters" became an unfocusable, uppercase `Badge` with white text on `accent-200`;
  Mantine tooltips don't wrap, so long help text ran across the viewport; new TS errors in
  `TermFilterForm`/`TermAutocompleteForm`; loading bar / fade-in referenced undefined keyframes; Pill remove
  buttons unreachable by keyboard; categories could not be removed from the filter input once at the max.
- **Cascade:** unlayered Mantine CSS beat Tailwind v4's layered utilities, so non-`!` classes on Mantine
  components were silently dropped and 31 class lists relied on `!important`.
- **Theme:** hardcoded hex/px in inline `styles`; defaults repeated at call sites.
- **Dead code:** GeneForm, TermAutocompleteForm, IconButton, NavButton, RenameTabDialog (unreachable since
  `d2fad85`), `@pango.core/colors/*`, empty/unused test files, `@mantine/form`, `@mantine/notifications`.
- **Tooling:** `tsc` in `build`/`type-check` checked nothing (solution `tsconfig.json`); `eslint .` failed on
  `vite.config.ts`; Prettier's Tailwind plugin pointed at a deleted config; 3 of 7 tests failing.
- **Docs:** CLAUDE.md documented MUI.

## Steps

### Phase 1: Tooling ✓
- [x] tsconfigs: app includes `tests` + `@tests/*`; node config `noEmit`, strict; build info in `node_modules/.tmp`
- [x] `type-check` / `build*` use `tsc -b`; `test:watch` added; `@types/node` added (vite.config.ts was never checked)
- [x] vite: checker `buildMode`, tests in `tests/`, `@tests` alias, vendor `manualChunks`
- [x] ESLint parses `vite.config.ts` via `tsconfig.node.json`; Prettier uses `tailwindStylesheet`

### Phase 2: CSS + theme ✓
- [x] Layer order + `styles.layer.css`; Tailwind brand colours read Mantine CSS variables (`@theme inline`)
- [x] `--animate-fade-in` / `--animate-loading-bar` keyframes
- [x] app-base.css: dead MUI/perfect-scrollbar rules and the global focus-outline kill switch removed
- [x] `palette.ts` (single hex source) + token-based `mantineTheme` (named export, typed tuples)
- [x] App: no unused `Notifications`, no duplicate `StrictMode`

### Phase 3: Fixes + cleanup ✓
- [x] `useIsMobile`, `withApiVersion`, `FilterPill`
- [x] GeneSearch / Toolbar / FilterSummary / TermFilterForm / ChildTermFilterDisplay / CategoryStats / Genes /
      LeftDrawer / RightDrawer / Layout / Home / Gene / GeneSummary / VersionedLink / VersionedButton
- [x] All `!` prefixes removed; classes that never applied removed (or adjusted — see Notes)
- [x] Pre-existing type/lint errors fixed (OverrepForm, genesSlice, VersionBanner, AnnotationDetails, trackEvent arg)
- [x] Dead files and deps removed

### Phase 4: Tests ✓
- [x] Tests in `tests/` mirroring `src/`; mockReset-safe `tests/setup.ts`; `renderWithProviders` with router + Mantine test env
- [x] Fixtures: `builders.ts`, `state.ts` (through real reducers), `mocks.ts` (`queryResult`, `mockMatchMedia`)
- [x] 12 files / 47 tests (was 3 / 7 with 3 failing)

### Phase 5: Docs ✓
- [x] CLAUDE.md (styling rules, layers, testing), README, pointer from the old migration plan

### Phase 6: Verification ✓
- [x] `npm run type-check`, `npm run lint`, `npm run test`, `npm run build` all green; Prettier clean on touched files
- [x] Compiled CSS layer order: properties, theme, base, mantine, components, utilities; no palette hex in CSS
- [x] Visual before/after comparison (HEAD vs working tree, same mocked API data, desktop + mobile, dev and
      production bundle) — see Notes
- [x] Independent review of the diff — 6 findings, all fixed (see Review below)
- [x] Real-browser keyboard/touch checks of the toolbar search after the review fixes

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** ✅ TASK COMPLETE — review findings fixed, all checks green.
- **Next immediate action:** None. Commit when the user asks (site-react paths only).
- **Recent commands run:** `npm run build`, `npx tsc -b`, `npx eslint .`, `npx vitest run`, Playwright smoke test
- **Uncommitted changes:** site-react only (52 tracked files changed + new `tests/`, `palette.ts`,
  `FilterPill.tsx`, `useIsMobile.ts`, `withApiVersion.ts`, this plan). Nothing staged or committed.
- **Environment state:** no servers running. Scratch artefacts (HEAD export, screenshots, Playwright scripts)
  live in the session scratchpad only.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| `npx tsc -b` with the old `tsconfig.node.json` (`composite: true`) | Emitted `vite.config.js`, `vite.config.d.ts`, `*.tsbuildinfo` into `site-react/` (a stray `vite.config.js` would shadow `vite.config.ts`). Deleted; fix is `noEmit` + `tsBuildInfoFile` in `node_modules/.tmp`. | 2026-10-02 |
| Visual check against the live public API from localhost | CORS + Cloudflare bot challenge (403) for headless browsers. Used Playwright `route()` with canned GraphQL data instead. | 2026-10-02 |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `package.json`, `package-lock.json` | scripts (`tsc -b`, `test:watch`); −`@mantine/form`, −`@mantine/notifications`, +`@types/node` | Done |
| `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `.eslintrc.json`, `.prettierrc.json`, `.gitignore` | tooling (see Phase 1) | Done |
| `src/index.css`, `src/styles/app-base.css` | cascade layers, colour mapping, keyframes, dead rules | Done |
| `src/@pango.core/theme/palette.ts` (new), `mantineTheme.ts`; `theme.ts`, `colors/*` deleted | theme | Done |
| `src/App.tsx`, `src/app/{Home,Gene}.tsx`, `src/app/layout/{Toolbar,Layout,LeftDrawer,RightDrawer,VersionBanner}.tsx` | fixes/cleanup | Done |
| `src/features/genes/components/{GeneSearch,Genes,GeneSummary}.tsx`, `forms/OverrepForm.tsx`, `slices/genesSlice.ts` | fixes/cleanup | Done |
| `src/features/search/components/FilterSummary.tsx`, `src/features/terms/components/{TermFilterForm,ChildTermFilterDisplay}.tsx` | fixes/a11y | Done |
| `src/features/annotations/components/{AnnotationTable,AnnotationDetails}.tsx` | `!` removal, unused prop | Done |
| `src/shared/components/{CategoryStats,VersionedLink,VersionedButton}.tsx`, `FilterPill.tsx` (new) | fixes/a11y/types | Done |
| `src/shared/hooks/useIsMobile.ts`, `src/shared/utils/withApiVersion.ts` (new) | shared helpers | Done |
| Deleted: GeneForm, TermAutocompleteForm, IconButton, NavButton, RenameTabDialog, `src/test/*`, `src/setupTests.ts`, `src/utils/test-utils.tsx` | dead code / moved tests | Done |
| `tests/**` (new) | setup, test-utils, fixtures, 12 spec files | Done |
| `CLAUDE.md`, `README.md`, old migration plan | docs | Done |

## Review (independent agent) and fixes

| Finding | Fix |
| ------- | --- |
| Keyboard trap: the fake search input opened the search on focus, so Tab never reached GitHub/Download/About/Help; focus wasn't returned on close | Trigger is a real `<button>` (same look, better contrast); Escape/✕ return focus to it, a press elsewhere doesn't steal focus |
| Touch: tapping ✕ closed the search on `touchstart`, letting the tap land on what moved underneath (logos popover) | `GeneSearch` takes an `area`; the toolbar passes its whole search row, so presses there never count as outside |
| Pills shrank to Mantine's 22px | `h-6` on summary/child-term pills, `h-7` in the filter input (HEAD's heights) |
| Max-terms test couldn't catch a regression (jsdom loads no CSS) | Asserts the pill isn't `data-disabled` |
| Docs drift (dev guide recommended removed packages; README described `tailwind.config.js`); mobile About/Help dropped `?apiVersion` | Docs updated; icons use `withApiVersion` |
| Chunk names misleading (React inside `framer-motion`) | Explicit `react` chunk |

## Blockers

- None.

## Notes

- **Layers over VPE's `important`.** VPE uses `@import 'tailwindcss' important` because it is embedded in a
  Bootstrap shell. pango is standalone, so Mantine's documented approach (`styles.layer.css` + explicit layer
  order) is cleaner: utilities beat Mantine without `!`, inline/dynamic styles still win.
- **Visual parity rule.** With utilities now winning, classes the library used to override start applying.
  Each was checked against the long-standing MUI-era look: dead `rounded-md` on Buttons removed (theme radius
  is the look); `p-4` on category options → `px-4 py-1.5` (MUI's 6px 16px); search dropdown `shadow-lg` →
  Mantine `shadow="sm"`; `w-full` on the category count pills now applies, so they got `px-2` to fit the
  label (caught by the screenshot comparison). Plain-element utilities (`text-sm` on "View N more terms",
  `text-lg` on the row caret) apply again as they did under MUI. Intended hover states now work.
- **Screenshot comparison** (HEAD vs working tree, Playwright + mocked GraphQL): improvements confirmed —
  long tooltips wrap at 320px instead of one 900px line; aspect checkboxes no longer overlap their labels;
  "Clear All Filters" readable; search closes on click-away (HEAD stays open); mobile renders the mobile layout
  on first paint. No unintended regressions after the count-pill fix. Production bundle: 0 console errors.
- **RenameTabDialog:** only entry point (Genes "Options" menu) was commented out in `d2fad85`, and the
  migration dropped that block. Restore from `6042381` if the menu comes back.
- **Analytics:** "Functionome Category Expanded" passed the GO id as GA's numeric `value` (hidden by `any`);
  it is now in the label as `label (id)`, matching the other category events.
- `mockReset: true` resets every `vi.fn()` before each test — global stubs in setup must be plain functions.

## Summary

- Fixed the migration's regressions (search click-away, Clear All Filters, unwrapped tooltips, pill keyboard
  access, max-terms removal) and a keyboard trap + touch fall-through found in review.
- Mantine and Tailwind now share one cascade (`@layer … mantine … utilities`); no `!important` left; one colour
  source (`palette.ts`); token-driven theme with central defaults.
- `type-check`/`build` really type-check (`tsc -b`, incl. tests and `vite.config.ts`); lint covers the whole
  package; Prettier sorts Tailwind v4 classes; vendor chunks (main bundle 511 kB → 146 kB).
- Tests moved to `tests/` with fixtures; 47 passing (was 7 with 3 failing).
- Removed ~1,000 lines of dead code and two unused Mantine packages; docs describe the real stack.
- Follow-ups: see Additional Context.

## How it was checked

1. **Automated:** `npm run type-check` (`tsc -b`: app, tests, `vite.config.ts`), `npm run lint`,
   `npm run test` (12 files / 47 tests), `npm run build` — all green.
2. **Before/after screenshots:** HEAD (`6042381`, exported with `git archive` into a scratch folder) and this
   change each ran in a Vite dev server; this change also ran as a production build (`vite preview`). One
   Playwright script drove both through 12 states at 1440×900 and 390×844 — home with data, long tooltip,
   category tooltip, Download menu, toolbar search with results, click-away + category filter, filter-pill
   tooltip, expanded child terms, pager, gene page, annotation drawer, phone home. The live API blocks headless
   browsers (Cloudflare 403 + CORS), so every GraphQL request got the same canned data on both sides.
   Results: 0 console errors in every run; "search still open after a click outside" was true at HEAD and false
   now; the comparison caught the clipped category count pills, fixed before commit.
3. **Real-browser toolbar checks** (after the review fixes): Tab passes the search button; Enter opens the
   search with the field focused; Escape closes it and refocuses the button; tapping ✕ on a phone closes it
   without opening the logos popover underneath — 6/6 passed.
4. **Independent review** of the diff by a separate agent; findings and fixes are in the Review table above.

The screenshots (side-by-side pairs, raw before/after/production sets, zooms) and the Playwright scripts were
saved outside the repo, to `C:\Users\tmush\Downloads\pango-mantine-hardening-check\`.

## Lessons Learned

- A "green type-check" means nothing until you confirm the command type-checks files: `tsc` against a
  solution `tsconfig.json` (`files: []`) exits 0 without checking anything.
- When moving a library's CSS into a cascade layer, diff screenshots: classes the library used to override
  silently start applying (the count-pill `w-full` was invisible in code review and obvious in a screenshot).
- MUI → Mantine traps: Tooltip doesn't wrap by default; Badge is uppercase and a plain `<div>`; Pill remove
  buttons are `tabIndex=-1`/`aria-hidden`; `className` on Tooltip goes to both target and tooltip.
- Never open UI on `focus` of an element in the tab order — it turns Tab into a trap. Open on click/Enter and
  return focus to the trigger on dismiss.
- Click-outside on `touchstart` must treat everything that disappears on close (✕, the row) as inside, or the
  rest of the tap lands on whatever replaces it.

## Additional Context (Claude)

- Follow-ups worth doing later (out of scope here): an `AspectBadge` component for the ~7 copies of the
  coloured aspect circle; typed RTK Query endpoints (`builder.query<Result, Args>`); `@apollo/client` is
  bundled only for `gql`/`print` (`graphql-tag` + `graphql` would be far lighter); rewriting
  `docs/dev-guide-react.md`, whose examples describe another project's folders; keyboard navigation for the
  gene search results (they're links in a dropdown, not Combobox options).
