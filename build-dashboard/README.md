# PAN-GO build dashboard

Shows what each loader build did, and checks it against what is live.

Every `loader/scripts/all.sh` (or `run_index_es.sh`) run records itself as it goes into
`loader/builds/` (see [loader/docs/build-record.md](../loader/docs/build-record.md)):

- each step's timings and phases;
- the inputs, with sizes and checksums;
- the data figures: annotations, genes, GO and slim terms, references, contributing groups, and
  the consistency checks between the files;
- the NCBI calls;
- the Elasticsearch operations, and the checks run after indexing;
- warnings and errors.

This app reads those records, live while a build is going and afterwards.

It's a separate app from `site-react`, on the same stack: React 19, Vite 6, Mantine 9,
Tailwind 4, Redux Toolkit with RTK Query, and react-router 7. It has no backend of its own: a small
plugin on Vite's dev and preview servers reads the builds folder, read-only.

## Run it

```bash
cd build-dashboard
npm install
npm run dev            # http://localhost:4210, reading ../loader/builds/
```

Start a build in another terminal, from `loader/`, and it appears within seconds:

```bash
uv run bash scripts/all.sh -i ./downloads/input -a ./downloads/clean-articles.json -o ./downloads/output
```

`PANGO_BUILD_LABEL="pango-2 2.0.8"` names a build.

- **Sample records:** `PANGO_BUILDS_DIR=tests/fixtures/builds npm run dev` shows the app on the
  test fixtures.
- **Another folder:** to read another builds folder, set the same variable the loader writes with.

## What's where

- **Builds (`/`):** one row per build, with its status, its datasets' headline figures, and how
  many findings it has.
- **A build:**
  - **What to look at:** failures, steps that never ran, documents that didn't load, failed
    Elasticsearch checks, lost NCBI batches, inconsistent files, and large changes since the
    previous build.
  - **The pipeline:** datasets × steps; each cell opens its run.
  - **One card per dataset:** its figures, and the change since its previous build.
  - **The live check** (on request).
  - **A timeline**, the inputs, and how the build ran.
- **A dataset of a build:**
  - its figures against any other build of it;
  - its make-up as charts: aspects, evidence types, terms per gene, evidence per annotation,
    contributing groups, with-gene taxa;
  - every report table, and the Elasticsearch check.
- **A run:** phases with a timeline, counters and breakdowns, warnings and errors grouped with
  samples, NCBI calls, Elasticsearch operations, files written, how it ran, and the event log.
- **Environments (`/live`):** what is live where.
  - Each configured cluster's PAN-GO indexes, and which recorded build made each one (by index
    creation time).
  - Each API's counts per version, the builds they match, and which version `latest` serves.

## The live checks

They are read-only:

- **Elasticsearch:** `GET /`, `_cat/indices` and `<index>/_count`.
- **APIs:** one GraphQL count query per version (`annotationsCount`, `genesCount`), with the version
  in `X-API-Version`.

The dashboard's server makes these requests: the browser never talks to a cluster.

| Setting (`.env.local`, see `.env.example`) | Default                                                       |
| ------------------------------------------ | ------------------------------------------------------------- |
| `PANGO_BUILDS_DIR`                         | `../loader/builds`                                            |
| `LIVE_ES_TARGETS`                          | `local=http://localhost:9200`                                 |
| `LIVE_API_TARGETS`                         | `production=https://functionome.geneontology.org/api/graphql` |
| `LIVE_API_VERSIONS`                        | `pango-1,pango-2`                                             |
| `LIVE_BUILD_ES_URL`                        | unset: a build is checked against the cluster it recorded     |

**The production API can't be checked from a script.** It sits behind Cloudflare's bot challenge,
which answers anything but a browser with HTTP 403. The dashboard shows that as **Blocked**. To check
production from here:

- its admins can let this host through;
- or add the cluster behind it as an Elasticsearch target.

## Commands

| Command                                                 | What it does                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `npm run dev`                                           | Dev server on port 4210                                                         |
| `npm run build`                                         | Type-check, then a production build into `dist/`                                |
| `npm run preview`                                       | Serve the build (the builds API works there too)                                |
| `npm test`                                              | Vitest: model, server, formatting and page specs                                |
| `npm run test:e2e`                                      | Playwright on port 4211, over the fixtures, with a stub cluster and API on 4212 |
| `npm run type-check`                                    | `tsc -b` over the app, tests, server, e2e and configs                           |
| `npm run lint` / `lint:fix` / `format` / `format:check` | ESLint, Prettier                                                                |

`node e2e/screenshots.mjs <out dir>` takes a full-page screenshot of every page while
`npm run dev` runs over the fixtures.
