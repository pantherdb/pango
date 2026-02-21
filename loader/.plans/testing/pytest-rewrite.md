# Task: Rewrite tests as pytest with fresh sample data

**Status:** COMPLETE
**Branch:** main

## Goal
Replace old unittest tests with proper pytest tests, generate fresh test data from production downloads using `extract_sample_data.py`, fix all 4 failing tests, and expand coverage to untested modules.

## Summary

### Phase 1: Pytest rewrite (49 tests)
- Converted all 4 test files from unittest classes to pytest functions
- Generated fresh self-consistent test data (5 genes) from production data using `extract_sample_data.py`
- Created `tests/conftest.py` with shared fixtures for paths and DataFrames
- Fixed all 4 failing tests: added `named_gene` to test data, added `-hi` hierarchy flag
- Added `test_group_terms_unnamed_gene` test for sort_priority=20 case

### Phase 2: Coverage expansion (109 tests)
- Added 4 new test files for previously untested modules
- Expanded `test_clean_annotations.py` with get_evidence tests and edge cases
- Expanded `test_generate_gene_annotations.py` with load_parent_lookup and parent_ids tests
- Result: **109 tests passing, 0 failures**

## Recovery Checkpoint
> ✅ TASK COMPLETE

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| src/extract_sample_data.py | Added optional `-hi` hierarchy support | done |
| test_data/input/pango-test/* | Regenerated 6 files from production (5 genes) | done |
| test_data/clean-articles.json | Regenerated (37 articles) | done |
| test_data/output/pango-test/* | Regenerated clean annotations + gene annotations | done |
| tests/conftest.py | Created with path + DataFrame fixtures | done |
| tests/test_utils.py | Rewritten as pytest (16 tests) | done |
| tests/test_clean_articles.py | Rewritten as pytest (11 tests) | done |
| tests/test_clean_annotations.py | Rewritten as pytest + expanded (27 tests) | done |
| tests/test_generate_gene_annotations.py | Rewritten as pytest + fixed + expanded (15 tests) | done |
| tests/test_extract_sample_data.py | New — collect_referenced_entities, validate, filter (14 tests) | done |
| tests/test_check_unresolved_symbols.py | New — process_gene_entry, process_file (10 tests) | done |
| tests/test_config_base.py | New — file_path, dir_path, TableAggType (6 tests) | done |
| tests/test_get_articles.py | New — get_unique_refs, parse_article, load_existing_articles (10 tests) | done |
| pyproject.toml | Added `[tool.pytest.ini_options]` | done |

## Lessons Learned
- `generate_gene_annotations.py` uses a global `parent_lookup` dict — tests need an autouse fixture to reset it between tests
- The `named_gene` column was added to `clean_annotations.py` output but tests weren't updated
- `extract_sample_data.py` is effective for generating self-consistent small test datasets from large production data
