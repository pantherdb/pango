# Developer Guide — React / `site/`

Onboarding-style best-practice guide for the `site/` SPA. Read `site/CLAUDE.md`
first for the quick repo map; this doc is the deeper "how we do things here."

- Stack: **React 19 + Vite + TypeScript**, **Redux Toolkit + RTK Query**,
  **Mantine v9** (controls + shell), **Tailwind v4** (utility classes),
  **Vitest + Testing Library** (tests).
- Path alias: `@/*` → `src/*` (use it; avoid long `../../../` relative imports).

---

## 1. Folder philosophy — feature-first, not type-first

We organize by **feature**, not by file kind. Everything a feature needs lives
in one folder: its slice, its components, its selectors. Tests live in a
parallel `tests/` tree at the project root that mirrors `src/`.

```
src/
├── app/                     # store wiring + typed hooks (nothing else)
├── layout/                  # chrome: AppShell, Toolbar, panels, hotkeys
├── shared/components/       # cross-feature reusable components
└── features/
    ├── graph/               # React Flow renderer + shared wire-shape types
    ├── graph-cytoscape/     # Cytoscape renderer
    ├── graph-force/         # Force 2D/3D renderer
    ├── graph-sigma/         # Sigma renderer
    ├── graph-graphin/       # Graphin renderer
    ├── inspector/           # right-panel inspectors
    ├── search/              # Ctrl+K command palette
    ├── ui/                  # uiSlice — panels, selection, nonces
    ├── url-state/           # URL ↔ store sync
    └── view-config/         # layout picker, labels, palette, focus

tests/                       # mirrors src/, plus tests/setup.ts for Vitest
└── features/graph/graphSlice.test.ts   # tests for src/features/graph/graphSlice.ts
```

**Rules of thumb**

- A feature owns its slice, its selectors, and its components; its tests live
  at the mirrored path under `tests/`.
- Feature barrels (`features/<name>/index.ts`) re-export only what other
  features need. Internal helpers stay un-exported.
- If two features start importing the same thing, it probably belongs in
  `features/view-config/` (cross-cutting view state) or `shared/components/`
  (cross-cutting UI). Don't let `features/graph-cytoscape/` reach into
  `features/graph/` for anything but the shared **wire-shape types**.
- Don't put UI in `app/` or `layout/` that is really about a feature — keep
  the chrome thin and dispatch into feature slices.

### When do I make a new feature folder?

Create a new `features/<name>/` folder when you have **state + UI + selectors**
that belong together. Don't make a folder for a single throwaway component —
that's what `shared/components/` is for.

---

## 2. Components — small, typed, and composed

### 2.1 Default to function components with named exports

```tsx
// features/view-config/StylingControls.tsx
export function StylingControls() {
  const dispatch = useAppDispatch();
  const sizeByDegree = useAppSelector(selectSizeByDegree);
  // ...
}
```

- Named exports, no default exports (easier refactors, better IDE rename).
- Props: define a local `type Props = { ... }` above the component. Don't
  inline an object type on the signature unless it's one prop.
- Destructure props in the signature.
- Keep components small — if it's over ~100 lines, something wants to be
  extracted (a hook, a subcomponent, or a selector).

### 2.2 One concern per component

If a component is doing data fetching **and** rendering **and** layout
calculation, split it. We already have renderers (`CytoscapeCanvas`,
`ForceCanvas`, etc.) that should be pure views — fetching belongs upstream.

### 2.3 Extract custom hooks for stateful logic

Put reusable effect/state logic in `useFoo.ts` next to the component that
uses it (e.g. `features/graph/useElkLayout.ts`). Hooks follow the same
`use*` naming rule React enforces.

---

## 3. Styling — Mantine + Tailwind, clear split

**The rule** (project convention — follow it):

- **Mantine** for "real" components where you want built-in behavior,
  accessibility, and cohesive look:
  - Controls: `Button`, `ActionIcon`, `Switch`, `Select`, `SegmentedControl`,
    `Slider`, `Checkbox`, `TextInput`, `NumberInput`, `Tooltip`.
  - Typography: `Text`, `Title`, `Code` — anything where you want
    Mantine's color / size / weight props.
  - Structure: `AppShell`, `Modal`, `Drawer`, `Menu`, `Popover`, `Tabs`,
    `Accordion`, `Divider`, `Paper`, `Card`.
  - Forms & feedback: `useForm`, `notifications`, `Loader`.
- **Tailwind** for:
  - Layout: `flex`, `grid`, `items-center`, `justify-between`, `gap-2`, `w-full`.
  - Spacing: `p-4`, `px-2`, `mt-3`.
  - Simple text tweaks on plain `<h1>` / `<p>` / `<span>` when a full Mantine
    `Text` would be overkill: `text-sm text-neutral-500 font-semibold`.
  - Ad-hoc color/border/shadow utilities.
  - Responsive helpers: `md:flex-row`, `lg:hidden`.

### When to use which — concrete examples

```tsx
// ✅ Good — Mantine for the controls, Tailwind for the layout frame,
//           plain <h1> with Tailwind utilities for a one-off title.
<Group h="100%" px="sm" gap="sm" wrap="nowrap" justify="space-between">
  <Group gap="sm" wrap="nowrap">
    <Burger size="sm" opened={open} onClick={toggle} aria-label="Toggle" />
    <h1 className="m-0 text-sm font-semibold tracking-tight text-neutral-800">
      TTL Quick Viz
    </h1>
  </Group>
  <SegmentedControl size="xs" value={renderer} onChange={setRenderer} data={...} />
</Group>
```

```tsx
// ❌ Don't — reimplementing a Mantine button with Tailwind.
<button className="px-3 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-600">
  Save
</button>

// ✅ Do — use Mantine's Button.
<Button size="xs" onClick={save}>Save</Button>
```

```tsx
// ❌ Don't — using Mantine's Group just to flex two things.
// (Fine if you want Mantine's gap tokens, but Tailwind is lighter for simple cases.)
<Group gap={8}><Icon /><span>Label</span></Group>

// ✅ Do — Tailwind flex for pure layout.
<div className="flex items-center gap-2"><Icon /><span>Label</span></div>
```

### Mixing Mantine + Tailwind on the same element

Mantine components accept `className`. You can layer Tailwind utilities on
top for layout/spacing:

```tsx
<Stack className="h-full overflow-auto" gap="xs">
  ...
</Stack>
```

Don't fight Mantine's internal styles — if you need a deep override, prefer
Mantine's `styles` / theme overrides, not `!important` Tailwind classes.

### What NOT to pull in

- **No MUI / Chakra / Ant Design / Radix.** Mantine + Tailwind is the
  whole UI kit. Adding a third library balloons bundle size and creates
  three "right ways" to build a button.
- **No CSS Modules or styled-components.** Tailwind covers utility styling;
  Mantine covers component styling. One escape hatch: `*.module.css` is
  tolerable for genuinely unique canvas/overlay CSS, but think twice.
- **No inline `style={{}}`** except for dynamic values that can't be
  expressed in classes (e.g. `style={{ width: computedPx }}`).

---

## 4. State management — Redux Toolkit

### 4.1 Always use the typed hooks

```ts
// features/view-config/LayoutPicker.tsx
import { useAppDispatch, useAppSelector } from '@/app/hooks';
```

Never `import { useDispatch, useSelector } from 'react-redux'` directly —
the typed wrappers in `src/app/hooks.ts` give you `RootState` and
`AppDispatch` inference for free.

### 4.2 Adding a slice

1. Create `features/<name>/<name>Slice.ts` with `createSlice`.
2. Export `reducer`, action creators, and selectors from the slice file
   (or a neighboring `selectors.ts` for complex derivations).
3. Re-export the public surface from `features/<name>/index.ts`.
4. Register the reducer in `src/app/store.ts`.

```ts
// features/ui/uiSlice.ts
export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleLeftPanel(state) {
      state.leftPanelOpen = !state.leftPanelOpen;
    },
    // ...
  },
});

export const { toggleLeftPanel, requestFitView, ... } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
```

### 4.3 Selectors — prefer memoized for derived data

- Trivial reads: inline `useAppSelector((s) => s.graph.renderer)`.
- Derived / joined state: put it in `features/<name>/selectors.ts` and use
  `createSelector` from RTK. This avoids re-renders from new-array /
  new-object identity.

### 4.4 Nonce pattern for imperative commands

For one-shot commands (fit-view, relayout, reveal) that aren't "state" in
the Redux sense, we use **nonce counters**: dispatch bumps a counter, the
renderer subscribes with `useAppSelector` and runs the effect keyed on the
nonce value.

```ts
// features/ui/uiSlice.ts
reducers: {
  requestFitView(state) { state.fitViewNonce += 1; },
  requestRelayout(state) { state.relayoutNonce += 1; },
}
```

```tsx
// inside a renderer
const fitNonce = useAppSelector((s) => s.ui.fitViewNonce);
useEffect(() => {
  // skip first render if you don't want an initial fire
  rfInstance?.fitView();
}, [fitNonce]);
```

**Use this pattern** for new imperative commands. Don't pass refs down
the tree or use event buses.

### 4.5 Don't store derived data

Don't put `nodeCount = nodes.length` in a slice. Compute it from the slice
that owns the source of truth via a selector.

---

## 5. Data fetching — RTK Query

All `/api` calls go through `features/graph/graphApi.ts`. **Do not** write
hand-rolled `fetch`/`axios` calls in components.

```ts
// Adding a new endpoint
export const graphApi = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (build) => ({
    getGraphs: build.query<GraphSummary[], void>({ query: () => '/graphs' }),
    getGraph:  build.query<Graph, string>({ query: (id) => `/graphs/${id}` }),
    // ...add here
  }),
});

export const { useGetGraphsQuery, useGetGraphQuery } = graphApi;
```

- Types on the request and response are mandatory. These are the **wire
  shapes** — keep them in sync with `api/src/app/domain/models.py`.
- Register the middleware + reducer in `store.ts` (already done once —
  just add endpoints, not new APIs, unless genuinely separate).
- In components: use the generated hooks (`useGetGraphQuery(id, { skip: !id })`)
  and destructure `{ data, isLoading, error }`.

### Loading / error ladders

Show a real loading state and a real error state. Don't silently render
"no data." Error messages should surface the RTK Query error body — this
is a dev tool, devs want detail.

```tsx
if (isLoading) return <Loader />;
if (error)     return <Text c="red">Failed to load: {JSON.stringify(error)}</Text>;
if (!data)     return <Text c="dimmed">No graph selected.</Text>;
```

---

## 6. URL state

Shareable view state (selected graph, renderer, layout algo, focus) is
synced to the URL via `features/url-state/useUrlSync.ts`. When you add
persistent view state that should survive a reload or be shareable:

1. Add it to the relevant slice (`viewConfigSlice` for view state;
   `graphSlice` for renderer/selection).
2. Add it to the URL reader + writer in `useUrlSync`.
3. Precedence: URL wins on first load; subsequent Redux changes write back.

Don't use `useSearchParams` ad-hoc from components — the sync is centralized.

---

## 7. Hotkeys

All global hotkeys live in `src/layout/useAppHotkeys.ts`, using Mantine's
`useHotkeys`. To add one:

1. Register in `useAppHotkeys.ts` with the appropriate action dispatch.
2. Add the matching button/affordance in `Toolbar.tsx` (or wherever the
   visual affordance lives) so users can discover it.
3. Document the shortcut in `site/CLAUDE.md` and in the Tooltip `label`
   (`<Tooltip label="Fit view (F)">`).

---

## 8. TypeScript

Strict mode is on: `noUnusedLocals`, `noUnusedParameters`,
`verbatimModuleSyntax`, `erasableSyntaxOnly`.

- **Use `import type`** for type-only imports:
  ```ts
  import { setRenderer, type GraphRenderer } from '@/features/graph';
  ```
- Don't use `any` without a comment explaining why. Prefer `unknown` at
  boundaries, then narrow.
- Prefer `type` aliases over `interface` unless you need declaration
  merging. Consistency > mild style preference.
- Wire-shape types live in `src/features/graph/types.ts` and are the
  single source of truth on the frontend.

---

## 9. Testing — Vitest + Testing Library

```
npm test              # one-shot
npm run test:watch    # TDD loop
```

### Where tests live

Tests are kept **out of `src/`** so feature folders stay focused on shipping
code. Mirror the source path under `tests/`:

```
src/features/graph/graphSlice.ts        →  tests/features/graph/graphSlice.test.ts
src/shared/components/ErrorBoundary.tsx →  tests/shared/components/ErrorBoundary.test.tsx
```

`tests/setup.ts` is the Vitest setup file (jsdom polyfills for `matchMedia`
and `ResizeObserver`).

### What to test

- **Slices**: reducers are pure functions — test them directly, no mounting
  needed.
  ```ts
  expect(uiReducer(state, toggleLeftPanel())).toEqual({ ...state, leftPanelOpen: !state.leftPanelOpen });
  ```
- **Selectors**: test shape-changing derivations.
- **Components**: render with Testing Library, interact with user events,
  assert on user-visible output. Mock RTK Query hooks when needed (use
  `vi.mock('@/features/graph/graphApi', ...)`) rather than a real store.
- **Don't test implementation details**: no snapshot-of-every-div, no
  grepping class names. Test what the user sees and does.

### StrictMode double-invocation

`<React.StrictMode>` is enabled — effects run twice in dev and tests. Your
setup/teardown must be idempotent. If a test fails only in watch mode,
suspect a missing cleanup.

---

## 10. Adding a feature — worked example

Say you want a new "center on selected node" button.

1. **Is it a one-shot command?** Yes → add `requestCenterOnSelection` nonce
   reducer to `features/ui/uiSlice.ts`. Export the action from
   `features/ui/index.ts`.
2. **Register the hotkey.** Add `['c', () => dispatch(requestCenterOnSelection())]`
   in `useAppHotkeys.ts`.
3. **Add a toolbar affordance.** In `Toolbar.tsx`:
   ```tsx
   <Tooltip label="Center on selection (C)">
     <ActionIcon variant="subtle" onClick={() => dispatch(requestCenterOnSelection())}>
       <IconTarget />
     </ActionIcon>
   </Tooltip>
   ```
4. **Subscribe in each renderer** that should respond. Use `useEffect`
   keyed on the nonce; early-return if nothing is selected.
5. **Test the slice**: reducer increments nonce; action creator exists.
6. **Test the toolbar**: clicking the button dispatches the action.

If instead it were persistent view state (e.g. "show edge labels"):

1. Add the field to `viewConfigSlice`.
2. Add a selector in `features/view-config/selectors.ts`.
3. Add a toggle to `StylingControls.tsx` (Mantine `Switch`).
4. Sync to URL in `useUrlSync` if it's shareable.
5. Renderers read via the selector and re-render.

---

## 11. Gotchas

- **Two renderers coexist.** When adding a visual feature, decide
  consciously: one renderer, or both? Cross-cutting state goes in
  `view-config/` so both can read.
- **Wire-shape drift.** `src/features/graph/types.ts` must match
  `api/src/app/domain/models.py` and the JSON from `conversion/ttl2json.py`.
  Change all of them together or the UI breaks at runtime.
- **Dev proxy.** Vite proxies `/api/*` → `:8000`. If the API isn't running,
  every query returns 502 and the UI renders empty. Start `api/` first.
- **React 19 StrictMode.** Effects run twice in dev. Idempotent cleanup is
  not optional.
- **No CSS-in-JS leakage.** Don't add styled-components, emotion css prop,
  or CSS Modules alongside Mantine + Tailwind.

---

## 12. Anti-patterns we avoid

- Fetching inside every leaf component (hoist it).
- A giant `App.tsx` / monolith `Dashboard.tsx` component.
- `useState` for things that belong in Redux (selected graph id, panel open,
  view config) — and equally, Redux for transient UI (tooltip open, form
  draft) that belongs in `useState`.
- `any`, `// @ts-ignore`, and `as unknown as T` without a comment.
- `useMemo` on module-scoped constants (it's already stable).
- Reaching across features — `graph-cytoscape/` importing from `inspector/`,
  etc. Go through shared layers instead.
