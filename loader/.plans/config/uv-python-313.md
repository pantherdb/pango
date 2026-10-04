# Task: Switch the loader from Poetry/Python 3.10 to uv/Python 3.13

**Status:** COMPLETE
**Branch:** update-framework-n-lib

## Goal
The loader is managed with uv and runs on Python 3.13, the test suite is green, and the pipeline
output on full production data is unchanged.

## Context
- **Triggered by:** user: "now I am thinking to switch to use uv and python 13". The same request
  went to the API session, which is switching `api/` (see `api/.plans/config/uv-python-313.md`);
  this task covers `loader/` only and follows the API's conventions.
- **Related files:** pyproject.toml, poetry.lock -> uv.lock, .python-version, README.md, CLAUDE.md,
  tests/README.md, tests/run_tests.sh, scripts/*.sh

## Findings (spike in the session scratchpad, no repo changes)
- pandas 1.5.3 / numpy 1.26.4 have no Python 3.13 wheels: the only forced upgrades.
  Everything else in poetry.lock installs and passes on 3.13 (pytest 7.4.4 included).
- Test suite (171) passes unchanged on 3.13 with pandas 3.0.6 + numpy 2.5.3 (no warnings) and
  with pandas 2.3.3 (FutureWarning: groupby.apply on grouping columns, generate_gene_annotations:127).
- Full pango-2 data (86,886 annotations, 20,580 genes) through clean_annotations +
  generate_gene_annotations: py3.10/pandas 1.5.3 vs py3.13/pandas 3.0.6 -> identical records and
  order (groups canonicalized). Same runtime (~5 min + ~38 s).
- ES server is 8.5.0 (docker-compose): keep `elasticsearch<9`.
- `.venv\Scripts` on Windows has python.exe but no python3.exe, so scripts calling `python3`
  can't use the uv environment.

## Decisions
- pandas 3 (>=3.0,<4), numpy >=2.1,<3: forced upgrade goes to the current major, validated on
  full data; no code change needed. Other dependencies keep their poetry.lock versions and their
  Poetry caret ranges translated as-is (same policy as the API).
- `[tool.uv] package = false` with the API's comment; dev group via `[dependency-groups]`.
- scripts: `python3 -m src.*` -> `python -m src.*` so `uv run bash scripts/...` works on Windows.

## Steps
- [x] pyproject.toml -> PEP 621; drop the pandas-1.5 warning filter
- [x] uv.lock with poetry.lock versions for unforced packages (constraint-dependencies, then drop):
      23 of 28 unchanged; pandas 3.0.6, numpy 2.5.3, +tzdata, -pytz (pandas 3), -exceptiongroup/-tomli (<3.11 only)
- [x] .python-version = 3.13; delete poetry.lock
- [x] scripts python3 -> python (under `uv run`, python3 resolved to a global 3.11 without pandas)
- [x] docs: README.md, CLAUDE.md, tests/README.md, run_tests.sh
- [x] uv sync (replaced the broken .venv by itself), uv run pytest: 171 passed (also --frozen)
- [x] full-data check on pango-1 with the final environment

## Summary
Full production data, clean_annotations + generate_gene_annotations, old (py3.10, pandas 1.5.3)
vs new, records keyed by (gene, term) / gene with `groups` canonicalized:

| Data | New environment | Annotations | Genes | Result |
| --- | --- | --- | --- | --- |
| pango-2 | scratch, pandas 3.0.6 (latest deps) | 86,886 | 20,580 | identical, same order |
| pango-2 | scratch, pandas 2.3.3 (poetry.lock deps) | 86,886 | 20,580 | identical, same order |
| pango-1 | the real loader/.venv | 90,961 | 20,851 | identical, same order |

Runtime unchanged (~5 min clean_annotations, ~35-40 s gene step). 171 tests pass via `uv run
pytest`, `uv run --frozen pytest` and tests/run_tests.sh; `uv lock --check` passes.

## Recovery Checkpoint
> ✅ TASK COMPLETE

## Follow-ups (not done)
- CI (.github/workflows/main.yml) runs only data_conversion tests on 3.9; a loader job would be
  `astral-sh/setup-uv` + `uv sync --locked` + `uv run pytest` (tests need no ES or network).
- data_conversion (stdlib + pytest, CI on 3.9) and insights (log scripts, local venv) are not on uv.
- Other dependencies keep their old majors (packaging 21, python-dotenv 0.21, pytest 7); upgrade
  separately if wanted.
- index_es.load_json still opens files in text mode (ijson DeprecationWarning).

## Lessons Learned
- Git Bash `sed -i` rewrites CRLF files as LF; restore the EOL after scripted edits.
- Comparing per-record fingerprints (ijson streaming + sha1) handles 400 MB outputs in ~40 s
  without loading them; a dependency major upgrade is only "safe" once full data matches.
