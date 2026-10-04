# CLAUDE.md

Guidance for Claude Code in `build-dashboard/`.

## What this is

A separate app that reads the loader's build records and shows what each build did, then checks
it against the live Elasticsearch and API.

- **The pipeline side** is `loader/src/build_record/` and the steps that report through it.
- **The contract** between the two is `loader/docs/build-record.md` (schema 1), with
  `build-record.schema.json` beside it. Read it before changing either side.
- **The stack** is site-react's: React 19, Vite 6, Mantine 9, Tailwind 4, Redux Toolkit with RTK
  Query, react-router 7, react-icons (Feather). Testing is Vitest 3 and Playwright.
- **Inspiration:** the idea of a pipeline writing a JSON record for a dashboard comes from
  `C:\work\panther\p_builder_viz` and `go-pango-annotations-trials/builder-dashboard`. None of
  their code is copied.

## Architecture

```
server/                  the only backend: a read-only JSON API mounted on Vite's dev/preview server
  buildsStore.ts         reads <builds>/<build>/build.json + runs/<run>/run.json + events.jsonl; caches by mtime
  buildsApi.ts           routes GET /api/builds[/:b[/runs/:r[/events]]] and /api/live/*; the Vite plugin
  live.ts                the live probes: Elasticsearch GETs on an allowlist, GraphQL count queries
  targets.ts             LIVE_* settings from the server-side environment
src/features/builds/
  model/                 plain TS shared by server and browser: types, parse, health, summary, checks, compare, live, timeline
  services/buildsApi.ts  RTK Query endpoints; records are parsed on arrival
  pages/                 BuildsPage, BuildPage, DatasetPage, RunPage, EnvironmentsPage
  components/            the panels those pages are made of
src/shared/              format.ts, status.tsx (the status vocabulary), Panel, Table, Stat, charts, Misc
src/@pango.core/theme/   site-react's palette and Mantine theme
tests/                   mirrors src/ and server/; fixtures/builds is a builds dir (real captures + synthetic)
e2e/                     Playwright, with stub-upstream.mjs standing in for Elasticsearch and the API
```

- **The builds dir** is `PANGO_BUILDS_DIR`, else `../loader/builds`: the same variable the loader
  writes with.
- **`parseBuild` and `parseRun` are total.** They never throw: a wrong-typed field becomes null or
  empty and is listed in `issues`, and an unknown status literal is kept, not coerced. Add new
  record fields there first.
- **Health is computed, not stored.**
  - A `running` record silent for 6 heartbeats (at least 60 s) is `stale`.
  - An `ok` run with errors, a failed phase, failed HTTP calls or problem counters (`checks_failed`,
    `consistency_failed`, `bulk_errors`, `batches_failed`) is `issues`.
  - The server judges summaries by its own clock; pages use the response's `serverTime`.
- **Findings** (`model/checks.ts`) turn known patterns in the counters into one line each, worded
  for the person who acts.
- **"Previous build"** is the latest earlier build, by `as_of`, with a report for the dataset.
- **The live checks are read-only by construction.**
  - Elasticsearch gets GETs on an allowlist (`/`, `_cat/indices`, `<index>/_count`); there is no
    `_refresh`.
  - GraphQL documents with a mutation are refused.
  - A build is checked against the cluster it recorded, or `LIVE_BUILD_ES_URL`.
  - A Cloudflare challenge (production, 2026-10-04) is reported as `blocked`; never try to get
    past it.

## Conventions

- **Mantine for interactive controls** (Tooltip, Select, Button, Progress, Loader); plain elements
  and Tailwind for layout and text. Colours come from `src/@pango.core/theme/palette.ts` only.
- **No chart library.** Bars, histograms, timelines and sparklines are positioned divs or small
  SVGs, which also render in jsdom.
- **`model/` uses relative imports only.** The Vite config bundles it (through `server/`) before
  any `@/` alias exists.
- **Display rules:**
  - Absence is a dash (`ABSENT`), never 0.
  - Times are local; tests pin `TZ=UTC`.
  - Every status badge shows a word and an icon, not colour alone (`shared/status.tsx`).
- **Style:** Prettier as in site-react; typed Redux hooks only (`src/app/hooks.ts`).

## Testing

- **Page tests** mount the real route table with `renderRoute(path)` from `tests/test-utils.tsx`.
- **Data:** `serveBuilds()` (`tests/mocks/api.ts`) answers `fetch` with the real store and router
  over `tests/fixtures/builds`, at `FIXTURE_NOW` (2026-10-04T14:00Z). The live checks go to
  `fakeUpstream()`, which can be down or behind a challenge.
- **Server specs** run in the node environment (`// @vitest-environment node`).
- **Fixtures** (see `tests/fixtures/README.md`):
  - **Real:** the pango-test and pango-1 + pango-2 captures, and the two January backfills, with
    paths and the host sanitised.
  - **Synthetic:** the failed, NCBI-trouble, running and killed builds. They are derived from the
    real records by `tests/fixtures/make_fixtures.py`.
  - Regenerate them only from real captures; never point a capture at the user's Elasticsearch or
    `loader/downloads`.

## Commands

| Command              | What it does                                     |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Port 4210                                        |
| `npm test`           | Vitest                                           |
| `npm run test:e2e`   | Port 4211, fixture builds, stub upstream on 4212 |
| `npm run type-check` | `tsc -b`                                         |
| `npm run lint`       | ESLint                                           |
| `npm run format`     | Prettier                                         |
| `npm run build`      | Production build                                 |

## Git

Do not add "Co-Authored-By" lines to commits.
