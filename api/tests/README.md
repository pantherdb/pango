# PAN-GO API tests

## Running

```bash
uv run pytest                        # everything; integration tests skip without Elasticsearch
uv run pytest -m "not integration"   # offline only, a few seconds
uv run pytest tests/test_http.py     # one module
```

The integration tests need an Elasticsearch 8.x. They only ever talk to `PANGO_TEST_ES_URL`
(default `http://localhost:9200`), never to `PANGO_ES_URL`:

```bash
docker run --rm -d --name pango-api-pytest-es -p 19200:9200 \
  -e discovery.type=single-node -e xpack.security.enabled=false \
  docker.elastic.co/elasticsearch/elasticsearch:8.5.0
PANGO_TEST_ES_URL=http://localhost:19200 uv run pytest
docker stop pango-api-pytest-es
```

PowerShell: `$env:PANGO_TEST_ES_URL = "http://localhost:19200"; uv run pytest`

They create `pango-test-pytest-annotations` and `pango-test-pytest-genes` with the loader's index
settings and mappings (`loader/data/es_settings`), load the loader's fixture output
(`loader/test_data/output/pango-test`), query them with `X-API-Version: pango-test`, and delete
them afterwards.

## Layout

| Module | Covers |
|---|---|
| `test_config.py` | `ApiVersion`, `Settings`, `GraphQLContext.get_index`, `VersionManager` |
| `test_utils.py` | `is_valid_filter`, `convert_camel_case`, `get_selected_fields` |
| `test_models.py` | Strawberry types built from ES documents; input defaults |
| `test_query_builders.py` | ES DSL for every filter argument, autocomplete queries, aggregations |
| `test_annotation_resolver.py` | `annotation`, `annotations`, `genes`, `annotationsExport` resolvers |
| `test_stats_resolvers.py` | counts, `geneStats`, `termStats`, `get_annotations_stats`, bucket metadata |
| `test_autocomplete_resolver.py` | `autocomplete`, `slimTermsAutocomplete` resolvers |
| `test_schema.py` | the published schema: signatures, inputs, defaults, output types |
| `test_http.py` | transport, GraphQL error contract, CORS, `X-API-Version` / `?version=` routing |
| `test_graphql_queries.py` | every query field over HTTP: arguments → ES request → JSON |
| `test_loader_contract.py` | every document the loader writes loads and serialises |
| `test_frontend_contract.py` | `site-react` GraphQL documents validate and run with the UI's variables |
| `integration/` | the same API against a real Elasticsearch, checked against `integration/oracle.py` |

Shared code: `conftest.py` (environment, fixtures), `factories.py` (documents and ES responses in
the shapes Elasticsearch 8.5 returns), `helpers.py` (paths, `GraphQLClient`, field selections).

## Conventions

- `conftest.py` pins the environment before `src` is imported (settings are read at import time)
  and forces the index base names to `pytest-annotations` / `pytest-genes`.
- Unit tests never reach Elasticsearch: an autouse guard fails any un-mocked call immediately.
  Request the `es_mock` fixture and assert on `es_mock.search.await_args.kwargs`.
- Mock Elasticsearch, not resolver functions: `annotation_schema.py` imports the resolvers by
  name, so patching `src.resolvers.<module>.get_x` has no effect (why the old tests hit a real ES).
  Each resolver module also holds its own `es` reference, so `es_mock` patches all of
  `RESOLVER_MODULES`.
- Integration expectations come from `integration/oracle.py`, plain Python over the fixture
  documents, not from hard-coded numbers.
- Confirmed bugs are `xfail(strict=True)` tests whose reason starts with `BUG:`; `-ra` lists them
  after every run. Fixing a bug makes its test pass, which strict mode reports as a failure:
  delete the marker then.

## Known bugs (strict xfail)

- `genes` returns each page in index order instead of `sort_priority`, `gene_symbol`.
- `slimTermsAutocomplete` can't search or aggregate `slim_terms.label` with the current loader
  mappings, and its nested aggregation would also suggest unrelated slim terms of matching genes.
- `autocomplete(autocompleteType: slim_term)` fails: unmapped collapse field, and `AttributeError`
  when `filterArgs` is given.
- Gene autocomplete never matches a full id such as `UniProtKB:Q9UNH6` (analyzer mismatch).
- `annotationsExport` fails for any page after the first (`from + 10000` > `max_result_window`).
- Trailing commas in `annotation_model.py` publish `geneIds`/`aspectIds`/`withGeneIds` defaults of `[""]`.
- `pageArgs: {page: null}` raises `TypeError`.
- `evidence { withGeneId { terms | slimTerms | termCount } }` errors.
- `slimTermsAutocomplete` never sets `displayId`.
- Annotation documents carry `coordinates_chr_num` as a float (`"1.0"`); a loader issue.
- Frontend: `GET_ANNOTATION_STATS_QUERY` and genes' `GET_ANNOTATIONS_QUERY` don't match the schema (unused).
