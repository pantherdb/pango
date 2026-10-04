# Task: Thorough test suite for the PAN-GO GraphQL API

**Status:** COMPLETE
**Issue:** n/a (user request)
**Branch:** update-framework-n-lib

## Goal
Replace the broken API tests with a layered pytest suite that pins every GraphQL field's contract
(arguments → Elasticsearch DSL → response JSON), runs offline by default, and has an opt-in
integration layer against a real Elasticsearch 8.5 using the loader's real index settings, mappings
and fixture data. Confirmed bugs are captured as `xfail(strict=True)` tests so the suite stays green
but flips the moment a bug is fixed.

## Summary
- **407 tests** on Python 3.10: 375 passed, 32 strict xfails (confirmed bugs); ~9 s with ES.
  Python 3.11/3.13: 370 passed, 37 xfailed (5 more: bug 8 only exists there).
  Without ES: 299 passed, 85 skipped (integration), 23 xfailed.
- Line coverage of `src/`: **97%**; the 19 missed lines are dead code (`main()` stubs, aggregation
  branches for keys the resolvers never request).
- 13 confirmed bugs documented below; none fixed (out of scope — tests only).
- Old suite (27 failed / 12 passed, mocks never applied) deleted.

## Context
- **Related files:** `src/**`, `pytest.ini`, `tests/**`
- **Consumers honoured:** `site-react/src/features/*/services/*QueryService.ts` documents and the
  variables sent by the RTK Query slices; `apiService.ts` always sends `X-API-Version` (default `pango-2`)
- **Data contract:** `loader/data/es_settings/*.json`, `loader/test_data/output/pango-test/*.json`
- **Triggered by:** user request "for the api, I want to write thorough tests"

## Strategy

| Layer | Where | ES | What it proves |
|---|---|---|---|
| Unit | `test_config/utils/models/query_builders`, `test_*_resolver(s)` | `es_mock` | Exact DSL per input; response parsing; edge cases |
| GraphQL/HTTP | `test_http`, `test_graphql_queries`, `test_schema` | `es_mock` | Transport, CORS, errors, version routing, every field end-to-end, schema contract |
| Contracts | `test_loader_contract`, `test_frontend_contract` | `es_mock` | Every loader doc serialises; every UI document validates and runs with the UI's variables |
| Integration | `tests/integration/` (`-m integration`) | real ES 8.5 | DSL works with the real mappings; answers equal a pure-Python oracle |

## Bugs / gaps found (all confirmed; strict xfail unless noted)

| # | Where | Bug | Evidence |
|---|---|---|---|
| 1 | `get_genes` | The second fetch by `ids` drops the `sort_priority`/`gene_symbol` sort → each page in index order | Real ES: SNX7, DUSP27, HSD17B13, MAATS1, CNTNAP3B |
| 2 | `get_slim_term_autocomplete_query_multi` | `slim_terms.label` is `index: false` with no `.keyword` since loader da7bf3b → `"auto"` gives `[]`, multi-token keywords → ES 400 | Real ES |
| 3 | same | Nested aggregation isn't filtered by the keyword → with a searchable label, `"autoph"` suggests all 9 slim terms of SNX7 | Real ES, scratch index with fixed mapping |
| 4 | `get_slim_term_autocomplete_query` (`autocomplete(slim_term)`) | Matches/collapses on `slim_term.*` (singular) inside nested `slim_terms` → ES 400 | Real ES |
| 5 | same | `GeneFilterArgs` passed to `get_annotations_query` → `AttributeError: term_type_ids` | Unit + real ES |
| 6 | Gene autocomplete | `standard` search analyzer keeps `uniprotkb:q9unh6` whole; ngram index analyzer splits on `:` → full ids never match | Real ES `_analyze` |
| 7 | `get_annotations_export` | `from_=page*size`, `size=10000` → any page ≥ 1 exceeds `max_result_window` → ES 400 | Real ES |
| 8 | `settings.get_versioned_index` (unused) | f-string of a `str` Enum renders `ApiVersion.V2-…` on Python ≥ 3.11 | **Fixed** in the uv/3.13 switch (`.plans/config/uv-python-313.md`) |
| 9 | `annotation_model.py` | Trailing commas → `gene_ids`/`aspect_ids`/`with_gene_ids` default to `(UNSET,)`; SDL publishes `= [""]` | `schema.as_str()` |
| 10 | `get_annotations` | `pageArgs: {page: null}` (legal GraphQL) → `TypeError` leaked to client | HTTP |
| 11 | `Evidence.withGeneId: Gene!` | `terms`/`slimTerms`/`termCount` never present on evidence genes → error, whole response nulled | HTTP |
| 12 | `slimTermsAutocomplete` | `displayId` never set (all other endpoints use the GO id) | Unit + HTTP |
| 13 | Loader → API | Annotation docs store `coordinates_chr_num` as float → `"1.0"` (genes give `"1"`) | Real ES |
| — | `withGeneIds`/`referenceIds` filters | Accepted, silently ignored (evidence mapped `enabled: false`) | Pinned, not xfail |
| — | `get_genes_query(None)` | Returns `None` (return inside the `if`); works only because the ES client drops `query=None` | Pinned, not xfail |
| — | Frontend `GET_ANNOTATION_STATS_QUERY`, genes' `GET_ANNOTATIONS_QUERY` | Unused documents that don't validate against the schema | xfail in contract test |

Observations without tests: debug `print`s in resolvers (`'pooop'`, a fake `GET pango-2-...` dump,
`Filtered gene_ids count`); raw exception text returned to clients (incl. ES response bodies);
`LATEST` → `pango-1` while the UI defaults to `pango-2`; the `term_type` filter queries the analysed
`text` field (others use `.keyword`); `get_terms_stats` caps its gene pre-filter at 10,000 genes;
`DocumentNotFoundError`/`VersionError` unused; frontend `getAnnotationsCount` reads `genesCount` from
an `annotationsCount` response (always 0; hook unused).

## Steps

### Phase 1: Investigation
- [x] Read all API source, old tests, loader mappings/fixtures, frontend GraphQL usage
- [x] Baseline old suite in scratch venv (27 failed / 12 passed)
- [x] Probe HTTP/CORS/error behaviours; capture real ES response shapes
- [x] Real ES 8.5.0 (docker, :19200) with loader mappings + fixtures; confirm bugs

### Phase 2: Infrastructure
- [x] `pytest.ini`: `[pytest]` header, `pythonpath = .`, `integration` marker, `-ra`
- [x] `tests/__init__.py`, `conftest.py` (env pinning, ES guard, `es_mock`, `gql`, loader data)
- [x] `factories.py` (documents + ES responses), `helpers.py` (paths, `GraphQLClient`, selections)

### Phase 3: Unit tests
- [x] `test_config.py`, `test_utils.py`, `test_models.py`, `test_query_builders.py`
- [x] `test_annotation_resolver.py`, `test_stats_resolvers.py`, `test_autocomplete_resolver.py`

### Phase 4: GraphQL / HTTP / contracts
- [x] `test_schema.py`, `test_http.py`, `test_graphql_queries.py`
- [x] `test_loader_contract.py`, `test_frontend_contract.py`

### Phase 5: Integration (real ES)
- [x] `integration/conftest.py` (reachability skip, create/load/teardown, one-loop session client)
- [x] `integration/oracle.py`; `test_es_annotations/genes/stats/autocomplete.py`

### Phase 6: Cleanup & docs
- [x] Deleted `test_basic_graphql.py`, `test_graphql_api.py`, `test_graphql_resolvers.py`
- [x] Rewrote `tests/README.md`; updated test commands in `CLAUDE.md` and `README.md`
- [x] Ran on 3.10, 3.11, 3.13 (with ES) and 3.10 without ES; stopped the ES container

## Recovery Checkpoint

> ✅ TASK COMPLETE

- **Uncommitted changes (api/ only):** see Files Modified. `loader/` and `site-react/` also show
  changes in the working tree that are NOT from this task (concurrent work) — leave them alone.
- **Environment state:** ES container stopped and removed; image
  `docker.elastic.co/elasticsearch/elasticsearch:8.5.0` (1.3 GB) left cached. Scratch venvs live in
  the session scratchpad only. `api/.venv` is still broken (untouched).

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Run tests with `api/.venv` | Base interpreter (pyenv 3.10.11) no longer exists | 2026-10-02 |
| Python `Path.write_text` to edit a test file | Saved CRLF on Windows; use `newline="\n"` | 2026-10-02 |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `pytest.ini` | Fixed header; `pythonpath`, `integration` marker, `-ra` | done |
| `tests/__init__.py`, `tests/integration/__init__.py` | Created | done |
| `tests/conftest.py` | Rewritten | done |
| `tests/factories.py`, `tests/helpers.py` | Created | done |
| `tests/test_config.py`, `test_utils.py`, `test_models.py`, `test_query_builders.py` | Created | done |
| `tests/test_annotation_resolver.py`, `test_stats_resolvers.py`, `test_autocomplete_resolver.py` | Created | done |
| `tests/test_schema.py`, `test_http.py`, `test_graphql_queries.py` | Created | done |
| `tests/test_loader_contract.py`, `test_frontend_contract.py` | Created | done |
| `tests/integration/conftest.py`, `oracle.py`, `test_es_*.py` (4) | Created | done |
| `tests/test_basic_graphql.py`, `test_graphql_api.py`, `test_graphql_resolvers.py` | Deleted | done |
| `tests/README.md` | Rewritten | done |
| `CLAUDE.md`, `README.md` | Test commands updated (CRLF/LF preserved) | done |
| `.plans/testing/api-test-suite.md` | This plan | done |

## Blockers
- None

## Notes
- Patch `es` in every resolver module (`RESOLVER_MODULES`); patching resolver functions at their
  source is a no-op because `annotation_schema.py` imported them by name.
- Integration tests must share one event loop (session `with TestClient(app)`): the shared
  `AsyncElasticsearch` binds its aiohttp session to the first loop that uses it.
- With `filter_path`, ES returns `{"took": n}` (no `hits` key) when nothing matches.
- Strawberry: validation/syntax errors → HTTP 200 + `errors`; malformed JSON / missing query → 400.
- CORS preflight echoes the Origin (`allow_credentials=True`) and the requested headers, so
  `X-API-Version` passes; simple requests get `Access-Control-Allow-Origin: *`.
- Refused connections on Windows take ~2 s per address, so the no-ES skip costs ~4 s once.

## Lessons Learned
- Probing a real Elasticsearch early paid off: 6 of the 13 bugs (sorting, analyzers, mappings,
  result window) are invisible with mocks.
- Capturing real response shapes first made the mocked-ES factories trustworthy.
- Oracle-based integration assertions + "fixture still exercises this filter" guards keep the
  suite valid if the loader fixtures are regenerated.
- Use `xfail(strict=True, raises=...)` so a broken test can't hide behind a known-bug marker.

## Follow-ups (not done)
- Fix the bugs above (each has a failing-when-fixed test). Highest value: #1 genes order,
  #2/#3 slim-term autocomplete (if the UI still uses it), #6 full-id gene search.
- ~~Recreate `api/.venv`~~ done by the uv/3.13 switch. Add `pytest-cov` if coverage is wanted:
  `uv add --dev pytest-cov` (`--cov` was documented but never installed).
- Optionally run `-m "not integration"` in CI, plus integration with an ES service container.
