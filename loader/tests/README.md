# Panther Pango Loader Tests

pytest suite for the loader. Nothing in it needs network access or a running
Elasticsearch.

## Running

From the loader root:

```bash
uv run pytest                            # everything
uv run pytest tests/test_pipeline.py     # one file
./tests/run_tests.sh                     # same as above, using .venv
./tests/run_tests.sh articles -x         # one area; extra args go to pytest
./tests/run_tests.sh help                # list areas
```

`run_tests.sh` picks the first Python that has the loader's dependencies
(`.venv`, then `python`). Override it with `PYTHON=/path/to/python`.

Known bugs show up in the summary as `XFAIL` with the bug in the reason (see
[Conventions](#conventions)).

## What is covered

| Test file | Module | Covers |
| --- | --- | --- |
| `test_get_articles.py` | `get_articles` | PMID extraction, article parsing, incremental fetch (only new PMIDs, batches of 100, rate-limit pause, failed batch refetched next run), atomic output write, CLI |
| `test_clean_annotations.py` | `clean_annotations` | term/gene/article/taxon lookups, evidence resolution, plus a hand-made dataset for cases the sample data lacks: unnamed genes, null `evidence_type`, unresolved PMIDs, cross-species with-genes |
| `test_generate_gene_annotations.py` | `generate_gene_annotations` | term de-duplication, `parent_ids`, `sort_priority`, gene ordering |
| `test_pipeline.py` | both of the above | golden-file test: runs the CLIs on `test_data/input` and compares with `test_data/output` |
| `test_es_mappings.py` | `data/es_settings` | every field a mapping declares appears in the pipeline output |
| `test_create_index.py` | `create_index` | index naming/prefix, drop-and-recreate, settings and mapping per index type |
| `test_index_es.py` | `index_es` | streaming JSON load, bulk load and error handling, CLI orchestration |
| `test_extract_sample_data.py` | `extract_sample_data` | reference collection/validation/filtering, CLI, and that a sample runs through the pipeline |
| `test_get_latest_versions.py` | `get_latest_versions` | picking the latest release per major version |
| `test_clean_articles.py` | `clean_articles` | legacy parser for raw esummary files |
| `test_check_unresolved_symbols.py`, `test_config_base.py`, `test_utils.py` | | small helpers |

Not covered: `get_articles_everything.py` (superseded by `get_articles.py`, not used
by any script) and `src/analysis/` (one-off analysis scripts).

## Test data

- `test_data/input/pango-test/`: a self-consistent 5-gene sample of a real
  release, made with `src/extract_sample_data.py` (`-hi` adds the hierarchy).
- `test_data/output/pango-test/`: the expected pipeline output for that input.

After an intended change to the pipeline output, regenerate the expected files
from the loader root and review the diff before committing:

```bash
uv run python -m src.clean_annotations \
  -a test_data/input/pango-test/human_iba_annotations.json \
  -t test_data/input/pango-test/full_go_annotated.json \
  -art test_data/input/pango-test/clean-articles.json \
  -tax test_data/input/pango-test/taxon_lkp.json \
  -g test_data/input/pango-test/human_iba_gene_info.json \
  -o test_data/output/pango-test/human_iba_annotations_clean.json

uv run python -m src.generate_gene_annotations \
  -a test_data/output/pango-test/human_iba_annotations_clean.json \
  -hi test_data/input/pango-test/go_hierarchy.json \
  -o test_data/output/pango-test/human_iba_genes_clean.json
```

## Conventions

- **No real Elasticsearch.** `conftest.py` replaces `src.config.es` with a mock
  before anything imports it, so no test can reach a cluster (`create_index`
  deletes indices). It also sets the `PANGO_*` variables `src.config.settings`
  needs at import time.
- **`index_es` is imported from a temp directory.** On import it reads `./.env`
  and truncates `./logfile.log`, so `test_index_es.py` imports it through a
  fixture instead of at the top of the file.
- **Known bugs are strict `xfail`s** whose reason starts with `BUG:`. The test
  describes the correct behavior. When a fix lands the test passes, strict mode
  reports it as a failure (`XPASS(strict)`), and the marker should be removed.
- Shared fixtures in `conftest.py`: input/output paths, `write_json` (write a
  JSON file under `tmp_path`), `run_main` (run a module's `main()` with CLI
  arguments). `generate_gene_annotations.parent_lookup` is reset before each test.
