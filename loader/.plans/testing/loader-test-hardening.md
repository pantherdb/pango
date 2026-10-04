# Task: Audit and harden the loader test suite

**Status:** COMPLETE
**Branch:** update-framework-n-lib

## Goal
Close the coverage gaps left after the pytest rewrite (index_es, create_index,
get_articles' fetch loop, get_latest_versions, CLI entry points), make weak or
vacuous tests meaningful, fix the test runner, and record real bugs found as
strict xfail tests (production code unchanged).

## Summary

| | Before | After |
| --- | --- | --- |
| Tests | 119 passed | 167 passed, 4 xfailed (known bugs) |
| Line coverage of src/ | 53% | 88% |
| Injected regressions caught (21) | 6 | 20 |
| Warnings per run | 1,686 (pandas/numpy noise) | 5 (real: ijson text mode) |

The one surviving mutant reorders `parent_ids` without changing membership; the UI only
filters by membership, so it is equivalent.

- **Runner:** run_tests.sh/run_tests.py drove `unittest`, which found 0 of the pytest tests
  and exited 0. run_tests.sh is now a pytest wrapper (same area names, extra args pass
  through, picks a Python that has the deps); run_tests.py removed.
- **conftest:** sets PANGO_* env vars (src.config.settings won't import without them), stubs
  src.config.es so no test can reach a cluster, autouse reset of the parent_lookup global,
  `write_json` and `run_main` helpers; path fixtures are session-scoped.
- **New test files:** test_create_index, test_index_es (imported from a tmp CWD because it
  truncates ./logfile.log and reads ./.env on import), test_es_mappings (mapping fields must
  appear in pipeline output), test_get_latest_versions.
- **Extended:** get_articles (fake esummary endpoint: only-new PMIDs, batches of 100,
  rate-limit sleep, failed batch refetched next run, atomic write), clean_annotations (hand-made
  dataset: unnamed gene, null evidence_type, unresolved PMID, mouse with-gene),
  generate_gene_annotations (named-first ordering), extract_sample_data (CLI + sample runs
  through the pipeline), check_unresolved_symbols CLI.
- **Strengthened:** test_pipeline runs the real CLIs once per module, canonicalizes only the
  set-derived `groups` (author/parent order no longer masked), compares full records (no zip
  truncation). Removed a test that could not fail and one that read gitignored downloads/.
- **pytest config:** `-ra`, `xfail_strict = true`, filter the pandas 1.5/numpy 1.26 warning.

## Bugs found (strict xfail with `BUG:` reason; verified each flips to XPASS(strict) with a fix)
1. get_articles: bare `-o articles.json` -> os.makedirs('') FileNotFoundError after fetching.
   Fix: `os.makedirs(os.path.dirname(out_fp) or '.', exist_ok=True)`.
2. get_articles: PubMed returns `{"uid", "error"}` for unknown PMIDs (checked against the live
   API); parse_article's `res['authors']` KeyError drops the whole 100-PMID batch.
   Fix: `res.get('authors')`.
3. get_latest_versions: grouped by major.minor, named pango-<major>; a 2.1 release next to 2.0.x
   -> FileExistsError. Fix: group by major only.
4. extract_sample_data.validate_references ignores with_gene_ids; clean_annotations then raises
   KeyError. Fix: also check `references['with_genes'] - genes_lookup`.

## Recovery Checkpoint
> ✅ TASK COMPLETE

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Running tests with the project .venv | .venv points at a removed pyenv-win Python 3.10.11; used a scratch uv venv with poetry.lock versions instead | 2026-10-02 |
| Write tool on CRLF files | Rewrote conftest.py/test_pipeline.py as LF (whole-file diff); converted back to CRLF | 2026-10-02 |

## Follow-ups (not done)
- Fix the four bugs above, then drop their xfail markers.
- index_es.load_json opens the file in text mode; ijson warns this will become an error
  (open with 'rb').
- Recreate the .venv (`poetry env remove --all && poetry install`).
- get_articles_everything.py and config/base.py (top-level) look dead; consider deleting.
- taxon_id is a string in annotations output but an int in genes output (pd.read_json re-infers).
- uniquify_slim_terms: when several annotations reach the same slim term, the last one's
  evidence_type wins — intended?
- name_suggest in genes_mappings.json is never populated and not used by the API.

## Lessons Learned
- Mutation testing (scratch copy, one source edit at a time, old vs new suite) is a quick,
  convincing way to measure whether new tests add value beyond coverage.
- Sampled golden data can silently miss whole branches (here: no unnamed genes), making tests
  that look meaningful vacuous; small hand-made datasets cover those cases.
