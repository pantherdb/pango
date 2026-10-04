# Task: Real test coverage for the site — unit, component and Playwright e2e

**Status:** COMPLETE
**Issue:** N/A (follow-up to `.plans/refactor/mantine-migration-hardening.md`, commit `5b4016f`)
**Branch:** `update-framework-n-lib`

## Goal

Every page and the logic behind it is tested: data transforms, API slices, Redux slices, hooks, the gene
page and annotation views, layout and routing, plus a committed Playwright e2e suite (mocked GraphQL, desktop
and phone) covering the main user journeys and the visual regressions fixed in `5b4016f`. A `test:coverage`
script with thresholds keeps it from slipping.

## Context

- **Baseline (measured on a scratch copy of `5b4016f`):** 12 files / 47 tests; 51% lines, 55% functions.
  0% for `Gene.tsx`, `AnnotationTable`, `AnnotationCards`, `AnnotationDetails`, `GeneSummary`, `TermCells`,
  `Layout`, both drawers, `App` routes, `Footer`, `VersionBanner`, About, Help, feedback banners,
  `useDocumentTitle`; `genesService` 9%, `utils/api` 14%, `apiService` 32%, `linksService` 40%.
- **Constraints:** site-react only; no `.github/` changes (repo CI only runs a Python job; another session is
  active in `api/`/`loader/`). Prefer tests over source changes; source changes only to enable testing (e.g.
  exporting the route table) or to fix real bugs the tests expose (reported, not hidden).
- **Conventions:** see site-react/CLAUDE.md → Testing (renderWithProviders, fixtures, `queryResult`, plain
  stubs, `mockReset: true`).

## Steps

### Phase 0: Setup ✓
- [x] devDeps `@vitest/coverage-v8` (matches vitest 3.0.5), `@playwright/test` 1.60.0 (uses the installed Chromium)
- [x] scripts `test:coverage`, `test:e2e`, `test:e2e:ui`, `test:e2e:headed`; coverage config in vite.config.ts
- [x] `tsconfig.e2e.json` (+ reference, ESLint project + ignores); `.gitignore` for coverage and Playwright output
- [x] export the route table (`src/app/routes.tsx`) so routing is testable without a browser router
- [x] shared builders for annotations/evidence/references; `renderWithProviders({ withRouter: false })`
- [x] `playwright.config.ts` (dev server on 4319, desktop + Pixel 7 projects)

### Phase 1: Unit tests (logic) ✓ (fork A, 20 files)
- [x] services: genesService, termsService, linksService, utils/api, colors, useConfig
- [x] apiService (version from URL, headers, useApiVersion) and API slices through a real store + stubbed fetch
- [x] slices: drawer, terms, genes, annotations, selectedAnnotation; hooks: useDocumentTitle, useGeneStats, useSearch; analytics

### Phase 2: Component tests ✓ (forks B and C)
- [x] Gene page, AnnotationTable, AnnotationCards, AnnotationDetails, GeneSummary, TermCells, Terms, TermLink, GeneCard, feedback banners
- [x] Layout, LeftDrawer, RightDrawer, Footer, VersionBanner, About, Help, routes, App
- [x] Genes loading/error/expand/mobile; CategoryStats child terms; Home panel + phone enrichment form

### Phase 3: E2E (Playwright) ✓
- [x] config: production build (`dist-e2e`, port 4319, `VITE_PANGO_API_URL=/api/`), desktop + Pixel 7 projects
- [x] fixtures: mocked GraphQL with a call log (`api.lastVariables`, API-version header), third-party requests
      offline, auto-fail on console errors
- [x] specs (29 tests): home + filters + child terms + panel, toolbar search (keyboard/touch/click-away),
      gene page + drawer + phone cards, navigation + apiVersion, layout regressions (tooltip wrap, count pills,
      checkbox spacing, utilities over Mantine, Clear All Filters)
- [x] stable: `--repeat-each=3` → 87/87 passed

### Phase 4: Wrap-up ✓
- [x] bugs the tests found fixed in src, each with a test (see Summary)
- [x] coverage thresholds just under the achieved numbers; global `testTimeout: 15_000`; Mantine CSS injection off in tests
- [x] CLAUDE.md + README testing docs
- [x] type-check, lint, unit (with thresholds), e2e, build all green

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** ✅ TASK COMPLETE — all phases done and verified.
- **Next immediate action:** None. Commit when the user asks (site-react paths only, no attribution).
- **Recent commands run:** coverage run on a scratch copy (`@vitest/coverage-v8` installed there only)
- **Uncommitted changes:** this plan.
- **Environment state:** nothing running.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `.plans/testing/test-coverage-and-e2e.md` | Create | Done |

## Blockers

- None currently.

## Notes

- **Bug found by e2e and fixed:** a closed left filter panel was only 0px wide — its controls stayed
  rendered and keyboard-focusable (Tab wandered into an invisible panel). Its content is now `invisible` when
  closed (`src/app/layout/Layout.tsx`).
- **Build:** vite-plugin-checker no longer runs during `vite build` (`enableBuild: false`); the build scripts
  already run `tsc -b`, so this removed a duplicate type-check and lets the e2e build start while unrelated
  test files are mid-edit. The dev-server overlay is unchanged.

- E2E mocks GraphQL in the browser (`page.route`): the public API blocks headless browsers (Cloudflare + CORS)
  and tests must not depend on live data.
- Pixel snapshots are platform-specific (`-win32.png`) and flaky across machines; layout regressions are asserted
  with geometry/DOM checks instead (e.g. tooltip width, label not clipped).

## Summary

- **Unit/component:** 53 files, 217 tests (was 12 / 47 with 3 failing). Coverage 99.6% lines, 93.7%
  branches, 92.1% functions (was 51% / – / 55%); thresholds 98/98/90/90 in vite.config.ts.
- **E2E:** 29 Playwright tests on a production build, desktop + Pixel 7, mocked GraphQL, auto-fail on console
  errors; `--repeat-each=3` → 87/87.
- **Bugs the tests found, all fixed with tests:**
  - closed filter panel stayed keyboard-focusable (Layout)
  - unknown `?apiVersion` dropped the version's URLs and was sent to the API → `resolveApiVersion` used by
    apiService, constants and useConfig
  - PubMed links broke for ids without `PMID:` (and AnnotationCards had its own copy)
  - unused annotations count read the genes field (always 0)
  - `transformGenes` mutated the API response
  - "View N more terms" did nothing on desktop and collapsed the section on phones (GeneSummary)
  - the gene page banner prefilled the feedback form with the URL id, the floating button with the symbol →
    shared `feedbackFormUrl`; the banner's analytics now records the URL actually opened
  - the drawer's gene link dropped `?apiVersion`
  - icon-only close button on the phone enrichment form had no accessible name
  - the gene list's loading overlay is now announced (`role="status"`)
- **Not done (follow-ups):** unused code worth deleting (`useGetAnnotationStatsQuery`,
  `useGetSlimTermsAutocompleteQuery`, `useGeneStats`, `useSearchFilter`, `calculateFontSize`,
  `getGeneAccession`, `getErrorMessage`); a CI job for the site (the repo workflow only runs a Python job and
  `.github/` was out of scope); an automated a11y scan (e.g. axe) in e2e.

## Lessons Learned

- Tests written against real behaviour found 11 bugs in code that had shipped; most were invisible in
  review (wrong field names, no-op handlers, inconsistent prefill, focusable hidden panels).
- jsdom role queries are slow when MantineProvider injects its CSS variables; tests don't need them.
- Running e2e against a production build is both faster and more stable than the dev server under parallel
  workers (on-demand compilation caused first-load timeouts).
- Parallel forks worked well with strict file ownership and no shared-file edits; shared fixtures and config
  were prepared before forking.

## Additional Context (Claude)

-
