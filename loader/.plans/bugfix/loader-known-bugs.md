# Task: Fix the four bugs found while hardening the loader tests

**Status:** COMPLETE
**Branch:** update-framework-n-lib

## Goal
Fix the bugs documented as strict xfail tests in `.plans/testing/loader-test-hardening.md`,
remove their xfail markers, and keep the full suite green.

## Summary
Suite: 171 passed, 0 xfailed (was 167 passed, 4 xfailed). Source diff: 17 insertions, 6 deletions.

| Bug | Fix |
| --- | --- |
| get_articles: bare `-o articles.json` crashed in os.makedirs('') after fetching | `os.path.dirname(out_fp) or '.'` |
| get_articles: an unknown PMID (`{'uid', 'error'}` from esummary) made the whole batch get dropped | skip error entries with a printed warning; keep the rest of the batch |
| get_latest_versions: grouped by major.minor, named by major -> FileExistsError at the first 2.1 release | group by major; folder name comes from the group key |
| extract_sample_data: with_gene_ids not validated -> samples that crash clean_annotations | reject samples whose with_gene_ids are missing from gene info |

Tests: removed the four xfail markers; the unknown-PMID test now pins the chosen behavior
(exact saved set, warning names the PMID, PMID is requested again on the next run); dropped the
now-unused `import pytest` in test_get_latest_versions.py.

Verified beyond the unit tests (outputs in the session scratchpad, nothing written to the repo):
- live PubMed: PMIDs 32639872 + 99999999999 -> warning for the unknown one, real article saved
  with title, 4 authors and date
- extract_sample_data on real pango-2 data (-n 25 -hi) passes validation; the sample runs
  through clean_annotations and generate_gene_annotations (25 genes, 129 terms)
- get_latest_versions old vs new on the real release folder names: identical
  (pango-1 <- 2023-08-11_1.0, pango-2 <- 2026-01-05_2.0.7), matching downloads/input

## Decisions
- **Unknown PMIDs are skipped, not saved as stubs.** The originally suggested fix was
  `res.get('authors')`, which would save `{'pmid', 'title': ''}`. The API's `Reference` type
  (api/src/models/base_model.py) requires pmid, title, authors and date, so that stub would make
  every annotation citing the PMID fail in GraphQL. A missing article becomes a null reference,
  which `Evidence.__init__` already filters out. Trade-off: the unknown PMID is requested again
  on each run (cheap; picks it up if PubMed adds it).
- Production check (downloads/, 2026-01 data): pango-2 cites 50,045 references, only 2 lack an
  article and both are non-PMID (DOI, GO_REF), so bug 1 had not lost data yet. PubMed answers
  non-numeric ids with a top-level `error` and leaves them out of `result`, so they don't break
  batches (they are re-sent every run; harmless).
- Production with_gene_ids: pango-1 38,468 and pango-2 43,040 distinct, 0 missing from gene
  info, so the new validation only rejects inconsistent samples.
- src/get_articles.py and src/get_latest_versions.py are LF in git but were CRLF on disk (old
  autocrlf checkout); converted back to LF after editing so the diff shows only the fix.

## Recovery Checkpoint
> ✅ TASK COMPLETE

## Still open (not part of this task)
- index_es.load_json opens the file in text mode; ijson warns this will become an error.
- get_articles' summary line "New: N" counts requested PMIDs, not saved ones.
- The other follow-ups listed in .plans/testing/loader-test-hardening.md.
