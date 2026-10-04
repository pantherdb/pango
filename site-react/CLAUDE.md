# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Vite dev server (opens browser automatically)
npm run start            # Start on port 4208 (development mode)
npm run build            # Type-check (tsc -b) + Vite build
npm run test             # Unit/component tests (Vitest)
npm run test:watch       # Vitest in watch mode
npm run test:coverage    # Vitest with coverage (report in coverage/, thresholds enforced)
npm run test:e2e         # Playwright e2e on a production build (test:e2e:ui, test:e2e:headed)
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format
npm run type-check       # tsc -b: app code, unit tests, e2e and config files
```

## Architecture

### Project Structure

- **`src/@pango.core/`** - Core shared module (theme, config data, base components, utilities, data models)
- **`src/features/`** - Feature-based modules (genes, annotations, terms, search), each containing:
  - `components/` - UI components for the feature
  - `slices/` - Redux Toolkit slices for state management
  - `services/` - API query definitions (GraphQL queries)
  - `models/` - TypeScript interfaces
  - `hooks/` - Custom React hooks
  - `utils/` - Feature-specific utilities
- **`src/app/`** - Application shell (pages, layout, Redux store, routing)
- **`src/shared/`** - Components, hooks (`useIsMobile`, `useDocumentTitle`) and utils used across features
- **`tests/`** - Vitest specs mirroring `src/` (see Testing)
- **`e2e/`** - Playwright specs and their mocked API (see Testing)

### State Management

Uses Redux Toolkit with RTK Query for API calls:

- Store configuration: [src/app/store/store.ts](src/app/store/store.ts)
- API service with version support: [src/app/store/apiService.ts](src/app/store/apiService.ts)
- GraphQL queries use `gql` + `print` from Apollo Client, sent via RTK Query's `fetchBaseQuery`

### Typed Redux Hooks

**Important:** Do NOT import `useSelector`, `useDispatch`, or `useStore` directly from `react-redux`. Use the pre-typed hooks from [src/app/hooks.ts](src/app/hooks.ts):

```typescript
import { useAppDispatch, useAppSelector } from '@/app/hooks'
```

ESLint enforces this rule.

### Path Aliases

`@/` resolves to `src/` and `@tests/` to `tests/` (configured in vite.config.ts and tsconfig.app.json).

### Styling

Mantine v9 for interactive components, Tailwind CSS v4 for everything else.

- **Mantine** for components with real behaviour: Button, ActionIcon, Tooltip, Menu, Popover, Select,
  Combobox/PillsInput, Checkbox, Drawer, Loader. Theme: `src/@pango.core/theme/mantineTheme.ts`.
- **Tailwind** for layout, spacing, colour and typography on plain elements (`<div>`, `<span>`, `<h1>`).
  Don't reach for Mantine layout primitives (Box, Paper, Stack, Group, Grid) for simple flex/grid.
- **Colours:** hex values live only in `src/@pango.core/theme/palette.ts`. The Mantine theme builds its
  `primary`/`accent` colours from it, and Tailwind's `primary-*`/`accent-*` utilities read the CSS variables
  Mantine emits (`@theme inline` in `src/index.css`). Don't hardcode brand colours anywhere else.
- **Cascade layers:** `src/index.css` orders `theme, base, mantine, components, utilities` and imports
  `@mantine/core/styles.layer.css`, so Tailwind utilities on Mantine components win without `!important`.
  Don't add `!` prefixes. If a utility still doesn't apply, it is losing to an inline style (a Mantine
  `styles` entry or style prop), not to Mantine's stylesheet.
- **Theme defaults, not call-site props:** Tooltip (`withArrow`, wraps long text at 320px), ActionIcon
  (`subtle` + `gray`), Button/ActionIcon radius and Select (`allowDeselect: false`) are set in the theme.
- **Breakpoint:** use `useIsMobile()` from `src/shared/hooks/useIsMobile.ts`; don't add media-query strings.
- **Accessibility:** icon-only buttons need an `aria-label`; removable filter pills use `FilterPill`
  (`src/shared/components/FilterPill.tsx`), whose remove button is keyboard-reachable and labelled.

### API Versioning

The app supports multiple API versions via URL query parameter `?apiVersion=`. Current versions defined in apiService.ts. Default is `pango-2`. In-app navigation keeps the selected version through `VersionedLink` / `VersionedButton` (both use `withApiVersion` from `src/shared/utils`).

## Environment Variables

Copy `.env.example` to `.env`. Required variables:

- `VITE_PANGO_API_URL` - Backend API URL
- `VITE_PANGO_API_VERSION` - Default API version

Access in code: `import.meta.env.VITE_*`

## Testing

Vitest + React Testing Library + jsdom. Specs live in `tests/`, mirroring `src/`
(`src/features/genes/components/Genes.tsx` → `tests/features/genes/components/Genes.test.tsx`).

- Render with `renderWithProviders` from `@tests/test-utils`: Redux store, the Mantine theme in test mode
  (no portals or transitions, so menus and dropdowns render synchronously) and a `MemoryRouter`.
  Options: `preloadedState`, `store`, `route`, `mantineEnv: 'default'` to exercise real portals.
- Build Redux state with `@tests/fixtures/state` (`buildSearchState`, `buildTermsState`, which run selections
  through the real reducers) and entities with `@tests/fixtures/builders`. Don't hand-roll slice state.
- Mock RTK Query hooks with `vi.mock(...)` plus `queryResult()` from `@tests/fixtures/mocks`; tests never hit
  the network.
- `mockReset: true` resets every `vi.fn()` before each test, so set return values inside the test or a
  `beforeEach`, and keep the global stubs in `tests/setup.ts` as plain functions.

- Route-level tests render the real route table (`src/app/routes.tsx`) in a `createMemoryRouter`, with
  `renderWithProviders(..., { withRouter: false })`.

Run a single test file:

```bash
npx vitest run tests/app/Home.test.tsx
```

### End-to-end (Playwright)

Specs in `e2e/` run a production build (`dist-e2e/`, served on port 4319) in Chromium, on a desktop and a
Pixel 7 project. First run on a new machine: `npx playwright install chromium`.

- Import `test`/`expect` from `e2e/fixtures/test`, not `@playwright/test`. Its auto fixtures answer every
  GraphQL request from `e2e/fixtures/mockApi.ts` (canned data; `api.lastVariables('GetGenes')` and
  `api.calls` show what the app sent), keep third-party requests offline, and fail any test that logs a
  console error.
- The build points the app at a same-origin `/api/` (`VITE_PANGO_API_URL` in playwright.config.ts), so
  there's no CORS and no dependency on local `.env` files.
- Split layout-specific tests with `test.skip(({ isMobile }) => isMobile, ...)`.
- Assert layout with geometry and computed styles (`boundingBox`, `toHaveCSS`), not pixel snapshots, so
  results don't depend on the machine.

## Code Style

See [docs/dev-guide-react.md](docs/dev-guide-react.md). Prettier sorts Tailwind classes using `src/index.css`.

## Task Management

### Always Create and Maintain Task Plans

See [.plans/template.md](.plans/template.md) for detailed examples and formats.

## Git Commits

- **Never** add `Co-Authored-By: Claude ...` trailers (or any Claude attribution) to commit messages.
