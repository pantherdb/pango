# Task: Record each loader build as JSON, and a `build-dashboard` app that shows and confirms it

**Status:** COMPLETE (2026-10-04). Uncommitted, as the user didn't ask for commits.
**Issue:** N/A (user request, 2026-10-04)
**Branch:** `update-framework-n-lib` (current)

## Goal

While the loader builds, every step writes what it did to a JSON build record, and a new app at
the repo root, `build-dashboard/`, shows the records live and afterwards, compares each dataset
with its previous build, and checks on request what the live Elasticsearch and API hold.

## Context

- **Triggered by:** the user, 2026-10-04: "another project build-dashboard … a separate react app at
  the root folder … during the build you gather a good json and make a result dashboard also maybe
  query to live db to confirm … same tech stack but feel free to just take it as inspiration".
- **Inspiration only; no code was copied:**
  - `C:\work\panther\p_builder_viz`: the pipeline spine and its frontier (steps never reached),
    checks with severities, comparison with the previous release, a results lens.
  - `go-pango-annotations-trials/builder-dashboard`: records per process with a heartbeat (so a
    dead run reads as stale), a read-only API on Vite's own server, a total parser, findings
    worded for the person who acts.
- **Plan template:** pango's `.plans/template.md`; every sibling repo has the same one. The extra
  sections (State before, Design decisions, Verification, Found while building) follow
  `go-pango-annotations-trials/.plans/feature/pipeline-dashboard.md`.

## Decisions (user, 2026-10-04)

The user's words: "local api also just search the es straight, this is for the developer and or it
can be configurable so it will be another test if you just do few queries to production, start
implementing yes fix the index. we will revisit the whole build process later".

1. **Local checks query Elasticsearch directly**, not the local API. API targets are configurable,
   and the production API is the default.
2. **Fix the `index_es` partial load.** It now uses `raise_on_error=False`, so every chunk is sent;
   failed documents are counted and logged, and the script exits 1.
3. **Build-process changes stay minimal.**
   - `all.sh` and `run_index_es.sh` gain only: begin/end, the dataset env var, and the
     `report`/`verify` steps.
   - `verify` records each check and exits 0 (`--strict` exits 1).
   - Deferred:
     - `release.json` from `get_latest_versions`; `begin` already reads it if one is present.
     - The other items under Found while planning.
4. **Branch:** stay on the current branch, no commits. The user committed the uv migration
   (`c7a8fcf`) during planning.

## Summary

### Loader

- **`src/build_record/`, the recorder:**
  - Stdlib only, never fatal, files replaced atomically (with a Windows retry), a 10 s heartbeat.
  - `current_run()` gives instrumented code a no-op stand-in when nothing records.
  - **`build.json`** holds the plan (datasets × steps), input fingerprints (sha256), git info,
    package versions and the outcome. `python -m src.build_record begin|end` writes it; the
    scripts call `end` from an exit trap.
  - **Each step's `run.json` + `events.jsonl`** hold:
    - phases, counters with breakdowns, progress;
    - warnings and errors grouped by message template;
    - NCBI calls, ES operations, files written with sha256 and record counts;
    - report sections, the exception if any.
  - A run outside a build is a build of its own (`adhoc`, or `backfill`).
- **Instrumented steps:** `get_articles` (NCBI calls, failed batches as warnings and counters),
  `clean_annotations`, `generate_gene_annotations`, and `index_es` (the fix, ES operations,
  progress by bytes, ijson opened `'rb'`).
- **New `src/data_report.py`:**
  - Streams the inputs and outputs: about 10 s over the 424 MB annotations.
  - About 30 always-present counters, 8 breakdowns, and the sections `inputs`, `annotations`,
    `evidence`, `genes` and `consistency` (5 checks between the files).
  - Group counts agree with `src/analysis/analyze_groups.py`.
- **New `src/verify_es.py`:** per index it checks:
  - that the index exists;
  - `_count` against the file's record count;
  - the fields the mapping file declares, listing the dynamic ones;
  - the ngram analyzer;
  - 20 sampled genes (`term_count`, annotation count);
  - that the creation time falls inside this build's index_es run.
- **The contract:** `docs/build-record.md` and `docs/build-record.schema.json`. Pytest validates
  every record a test writes against the schema.
- **Backfill:** `loader/builds/` holds two backfill builds over the January outputs, dated
  2026-01-25, as baselines for the next real build.

### `build-dashboard/` (site-react's stack: React 19, Vite 6, Mantine 9, Tailwind 4, RTK Query, router 7)

- **Server:** a Vite plugin serves `/api/builds…` from the builds dir, read-only and cached by
  mtime. `/api/live/…` probes:
  - Elasticsearch with GETs on an allowlist (`/`, `_cat/indices`, `<index>/_count`);
  - the APIs with one count query per version, refusing mutations, with timeouts.

  Settings: `PANGO_BUILDS_DIR`, `LIVE_ES_TARGETS`, `LIVE_API_TARGETS`, `LIVE_API_VERSIONS`,
  `LIVE_BUILD_ES_URL`.
- **Pages:**
  - **Builds:** the list.
  - **Build:** findings, the pipeline grid, dataset cards with the change since the previous
    build and trend lines, the live check, a timeline, inputs, provenance.
  - **Dataset (the results lens):** figures against any other build, make-up charts, every report
    table, the verify section.
  - **Run:** phases, counters, logs, HTTP, ES, files, process, events.
  - **Environments:** which recorded build made each live index; API counts per version, and what
    `latest` serves.
- **Model:** a total parser, computed health (stale/issues), findings, comparisons, the live
  comparison (match, differs, missing, unreachable, blocked, not asked).
- **Fixtures:** 8 builds (1.1 MB), made by `tests/fixtures/make_fixtures.py`.
  - Real, sanitised: the pango-test and full-data captures, and the two backfills.
  - Synthetic, derived from those: failed, NCBI trouble, running, killed.

## Verification (2026-10-04)

| Check | Result |
|---|---|
| loader pytest | 237 passed (171 before); no warnings (the ijson text-mode warning is gone) |
| `index_es` fix | A real-`helpers.bulk` test with a fake cluster: all 250 documents sent. The old default stopped after 100 |
| build-dashboard vitest | 125 passed, 16 files: model, server, format, 5 pages. The contract test parses every fixture record with nothing unread |
| type-check (`tsc -b`: app, node + server, e2e), ESLint, Prettier | clean |
| `npm run build` | ok. JS chunks: react 224 kB, mantine 191 kB, router 92 kB, app 85 kB, redux 80 kB; CSS 256 kB (39 kB gzip) |
| Playwright | 5 passed: dev server over the fixtures, stub ES/API on 4212 |
| Capture, pango-test | `all.sh` against a throwaway ES 8.5 on `:19200`: 8 s, `verify` 13/13 |
| Capture, pango-1 + pango-2 | 12.5 min. 90,961 annotations / 20,851 genes and 86,886 / 20,580; `verify` 13/13 each. Records 4–66 KB. Nothing in `loader/downloads` newer than the marker |
| Live check, local ES | The full capture's 4 indexes match the build exactly, created inside its index_es runs |
| Live check, production API | **Blocked.** Cloudflare's managed challenge answers scripts with HTTP 403. 8 read-only requests in all, none reached the API |
| Screenshots | Every page checked by eye; wide report tables, dates and sizes fixed after the first pass |

## Found while building (not changed; for the user)

1. **The production API can't be checked from a script.**
   - `functionome.geneontology.org/api/graphql` sits behind Cloudflare's managed challenge
     (`cf-mitigated: challenge`), which answers non-browser clients with a 403 "Just a moment…"
     page.
   - The dashboard reports this as **Blocked** and does not try to get past it.
   - To check production from a script, the site's admins could let a host through, or the
     production cluster could be added as an Elasticsearch target.
2. **The pipeline is deterministic.** A rebuild from the January inputs gave exactly the January
   outputs' figures, for both datasets.
3. **pango-1 cites 1 PMID with no article** (the report's `references_unresolved`); pango-2 has
   none. Both have 2 non-PMID references, which are asked for again on every run.
4. **The known `taxon_id` type split is confirmed on real data:** a string in annotations, an int
   in genes. The dashboard notes it as information.
5. **`loader/.env-example` names the indexes `annotations-index` and `genes-index`;** the user's
   `.env` and `api/.env.example` use `pango-annotations`.
6. **Side effect:** the captures ran `index_es` from `loader/`, which (as always) rewrote
   `loader/logfile.log`.
7. **Still open from planning:**
   - the `all.sh -s` substring match;
   - `logfile.log` truncated on import;
   - `latest` serving pango-1;
   - CI covering only `data_conversion`.

## Not done / follow-ups

- **`release.json` from `get_latest_versions`** (deferred with the build-process revisit). Until
  then the dataset cards show no release version.
- **A static export of one build,** for sharing without the dev server.
- **CI jobs** for the loader and the dashboard.
- **Staging as an API target** (`http://3.92.69.173/api/graphql`): it isn't behind Cloudflare, but
  it was not tried, because the user only agreed to production queries.
- **`request_timeout` passed through `helpers.bulk`** draws a deprecation warning from
  elasticsearch-py; it predates this work.

## Recovery Checkpoint

> ✅ TASK COMPLETE

- **Environment state:** nothing running. The throwaway ES (`pango-build-es`) is stopped and
  removed, and the dev server is stopped.
- **Scratch:** the session scratchpad still holds the captures (`capture-test/`, `capture-full/`)
  that `make_fixtures.py` regenerates the fixtures from.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Production API checks with the default `fetch` | Cloudflare challenge, HTTP 403. Reported as `blocked`; not worked around | 2026-10-04 |
| `python3 -` in Git Bash | The Windows Store stub waited on stdin; use `uv run python` | 2026-10-04 |
| Paths like `/builds/...` as arguments under Git Bash | MSYS rewrote them into Windows paths; use `MSYS_NO_PATHCONV=1` | 2026-10-04 |
| `grep -c $'\r$'` to count CRLF lines | Unreliable in Git Bash; count bytes in Python instead | 2026-10-04 |
| `uv add --dev jsonschema` | Rewrote `loader/pyproject.toml` as LF (CRLF in git); converted back | 2026-10-04 |
| Reading the 403 as an outage | The body was Cloudflare's challenge page; the dashboard now detects it | 2026-10-04 |

## Files Modified

| File | Action |
| ---- | ------ |
| `loader/src/build_record/{__init__,__main__,build,fingerprint,ledger,paths,provenance,recorder,storage}.py` | Created: the recorder |
| `loader/src/data_report.py`, `loader/src/verify_es.py` | Created: the new steps |
| `loader/src/{get_articles,clean_annotations,generate_gene_annotations,index_es}.py` | Instrumented; the `index_es` fix |
| `loader/scripts/all.sh`, `loader/scripts/run_index_es.sh` | begin/end trap, `PANGO_DATASET`, report + verify |
| `loader/docs/build-record.md`, `loader/docs/build-record.schema.json` | Created: the contract |
| `loader/tests/test_build_record.py`, `test_build_record_steps.py`, `test_data_report.py`, `test_verify_es.py` | Created: 66 tests |
| `loader/tests/conftest.py`, `loader/tests/test_index_es.py` | Recording off by default and the schema validator; tests for the fix |
| `loader/.gitignore`, `pyproject.toml`, `uv.lock`, `CLAUDE.md`, `README.md`, `tests/README.md` | `builds/`, `jsonschema` (dev), docs |
| `build-dashboard/**` | Created: the app, server, tests, e2e, fixtures, docs |
| `README.md` (root) | A fifth component |

Line endings were kept per file (`git ls-files --eol`: index = working tree for every modified file).

## Lessons Learned

- **A real capture against a throwaway ES found more than unit tests could:** record sizes, timing,
  the deterministic rebuild, and the `latest`/Cloudflare behaviour live.
- **Deriving the synthetic fixtures from real records** keeps them realistic. A generator in the
  repo keeps them reproducible.
- **The dashboard's "previous build" needs a data date** (`as_of`) separate from when a record was
  written, or backfills sort wrongly.

## Additional Context (Claude)

- **Counter names are now a contract between two codebases.** Rename one only with the dashboard's
  `compare.ts` and `checks.ts`, and the contract doc.
- **`verify` and `index_es` errors** are deliberately not repeated as "errors logged" findings: the
  dashboard reports them through their counters.
