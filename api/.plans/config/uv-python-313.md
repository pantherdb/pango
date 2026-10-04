# Task: Switch the API from Poetry/Python 3.10 to uv/Python 3.13

**Status:** COMPLETE
**Issue:** n/a (user request)
**Branch:** update-framework-n-lib

## Goal
The API is managed with uv and runs on Python 3.13 locally and in Docker, with the same dependency
versions as `poetry.lock` (a pure tooling switch: no upgrades mixed in) and a green test suite.

## Summary
- `pyproject.toml` is PEP 621 (`[project]`, `[dependency-groups] dev`, `[tool.uv] package = false`),
  `requires-python = ">=3.13"`; Poetry carets translated to identical ranges.
- `uv.lock` pins **exactly** the poetry.lock versions: 133 packages, 0 version changes; 4 backports
  dropped because 3.13 doesn't need them (`async-timeout`, `exceptiongroup`, `overrides`, `tomli`).
- `.python-version` = 3.13; `api/.venv` recreated by `uv sync` (CPython 3.13.13).
- Fixed the one 3.13 regression: `settings.get_versioned_index` used `f"{version}"` on a `str` Enum
  (renders `ApiVersion.V1` since 3.11) → `version.value`; its conditional xfail removed.
- Docker: `python:3.13-slim` + uv 0.11.7, `uv sync --locked --no-dev`, no `build-essential` (every
  dependency has a cp313 manylinux wheel); new `.dockerignore` keeps the local `.venv` (266 MB),
  `logs/` (53 MB), caches and `.env` out of the image. Image: 476 MB.
- Verified: `uv run pytest` on 3.13 → 375 passed / 32 xfailed with ES (299 / 85 skipped / 23 xfailed
  without); built image smoke-tested under gunicorn as `fastapiuser` against ES with the loader
  fixtures (counts, genes, termStats, geneStats, autocomplete, version routing).
- Docs: README (setup/run/test/dependencies), CLAUDE.md, tests/README → uv commands.

## Context
- **Scope:** `api/` only. The loader stays on Poetry for now: `pandas ^1.5` / `numpy ^1.23` have no
  3.13 wheels (needs pandas ≥ 2.2.3, numpy ≥ 2.1), and `loader/` had uncommitted work from another
  session. CI (`.github/workflows/main.yml`) only covers `data_conversion` on 3.9 — unaffected.
- **Triggered by:** user: "now I am thinking to switch to use uv and python 13"

## Steps

### Phase 1: Packaging
- [x] `pyproject.toml` → PEP 621 + dependency groups, `package = false`, same version ranges
- [x] `requires-python = ">=3.13"`, `.python-version` = `3.13`
- [x] `uv.lock` reproducing poetry.lock (temporary `constraint-dependencies`, then re-lock)
- [x] Delete `poetry.lock`

### Phase 2: Environment + tests
- [x] Remove the broken Poetry `.venv`; `uv sync`
- [x] `uv run pytest` offline and with ES

### Phase 3: Python 3.13 fix
- [x] `settings.get_versioned_index` → `version.value`; xfail dropped from `test_config.py`

### Phase 4: Docker
- [x] `Dockerfile` on `python:3.13-slim` with uv; `.dockerignore`
- [x] Build + smoke test against ES; containers and test image removed afterwards

### Phase 5: Docs
- [x] `README.md`, `CLAUDE.md`, `tests/README.md`; test-suite plan updated (bug 8 fixed)
- [x] Memory: replaced the broken-venv note with a migration note

## Recovery Checkpoint

> ✅ TASK COMPLETE

- **Uncommitted changes:** everything listed below, mixed with the (also uncommitted) test suite
  from `.plans/testing/api-test-suite.md`; README.md, CLAUDE.md and tests/README.md contain changes
  from both tasks.
- **Environment state:** nothing running. Cached images: `python:3.13-slim`, ES 8.5.0.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| `uv lock` / `uv lock --python 3.13` with the old `.venv` present | uv queries the project venv's interpreter, which no longer existed; worked with `UV_PROJECT_ENVIRONMENT` pointed elsewhere | 2026-10-03 |
| Constraining with every poetry.lock entry | poetry.lock has two `ipython` versions (8.37 for 3.10, 9.6 for ≥3.11) → contradictory pins; keep the highest per package | 2026-10-03 |
| Editing `settings.py` in place | File is CRLF on disk but LF in git → whole-file diff; saved as LF | 2026-10-03 |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `pyproject.toml` | Poetry → PEP 621/uv (CRLF kept) | done |
| `poetry.lock` | Deleted | done |
| `uv.lock`, `.python-version` | Created | done |
| `src/config/settings.py` | `get_versioned_index` uses `version.value` | done |
| `tests/test_config.py` | Removed the ≥3.11 xfail | done |
| `Dockerfile` | python:3.13-slim + uv | done |
| `.dockerignore` | Created | done |
| `README.md`, `CLAUDE.md`, `tests/README.md` | uv commands | done |
| `.plans/testing/api-test-suite.md` | Bug 8 fixed, venv follow-up done | done |

## Blockers
- None

## Notes
- Deliberately unchanged: `jupyterlab`, `notebook` and `pytest` remain main dependencies (so they
  ship in the image); stale unpinned `requirements.txt` (unused by Docker/CI) kept; no upgrades.
- `.env` is no longer baked into the image. Runtime is unaffected: compose sets every variable, and
  gunicorn's `--bind` never read `.env` (it's expanded by `sh` before Python loads `.env`).
- Upgrades are now explicit: `uv lock --upgrade` or `--upgrade-package <name>`.

## Lessons Learned
- Reproducing the old lock first keeps a tooling migration reviewable; upgrades can follow as a
  separate, testable step.
- Build and run the real image: it proved the wheels (no compiler needed) and caught the missing
  `.dockerignore` before it could ship a Windows venv into Linux.

## Follow-ups (not done)
- Loader: uv + 3.13 needs pandas 2.2.3+/numpy 2.1+ (validate with its tests); same lock recipe.
- Consider moving `jupyterlab`, `notebook`, `pytest` to a dev/optional group (smaller image).
- `uv lock --upgrade` as its own change, then rerun the suite (unit + integration).
- Optionally add a CI job: `uv sync --locked` + `uv run pytest -m "not integration"`.
- Replace or delete `requirements.txt` (`uv export --no-dev -o requirements.txt` if it's needed).
