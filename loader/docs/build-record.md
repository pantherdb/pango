# Build records

Written 2026-10-04. The record every loader build writes about itself while it runs, and the
contract `build-dashboard/` reads. The code is `src/build_record/`; a JSON Schema of both files is
`build-record.schema.json` next to this file. This is schema version **1**.

## Builds and runs

- **A build** is one `scripts/all.sh` or `scripts/run_index_es.sh` invocation. It covers every
  dataset folder under the input base (`pango-1`, `pango-2`, …).
- **A run** is one step process for one dataset: `get_articles`, `clean_annotations`,
  `generate_gene_annotations`, `report` (`src.data_report`), `index_es` or `verify`
  (`src.verify_es`).

```
<builds dir>/<build id>/build.json                   the build: what it planned, its inputs, how it ended
<builds dir>/<build id>/runs/<run id>/run.json       a snapshot of one run
<builds dir>/<build id>/runs/<run id>/events.jsonl   that run's append-only timeline
```

- **Builds dir:** `PANGO_BUILDS_DIR`, default `loader/builds/` (gitignored).
- **Build id:** `<UTC start>-<script>-<4 hex>`, e.g. `20261004T153000Z-all-3f2a`. Ids sort by
  start time.
- **Run id:** `<UTC start>-<step>-<dataset>-<pid>-<4 hex>`.
- **The scripts:**
  - **`begin`:** `python -m src.build_record begin` writes `build.json` and prints the id, which the
    script exports as `PANGO_BUILD_ID`.
  - **`end`:** a trap on exit runs `python -m src.build_record end --exit-code $?`, so a build that
    fails part-way still says so.
  - **The dataset name:** each dataset's steps get `PANGO_DATASET`.
- **A run outside any build** (no `PANGO_BUILD_ID`, or one whose `build.json` is missing) makes a
  build of its own. Its `script` is `adhoc`, or `backfill` for `data_report --backfill`, and the
  run writes that `build.json` itself.
- **Environment variables:**
  - `PANGO_BUILD_LABEL`: free text for the build.
  - `PANGO_RECORD=0`: turns recording off.

## How they are written

- **Atomic snapshots:** `build.json` and `run.json` are rewritten through a temp file and
  `os.replace`, so a reader never sees half a file. On Windows a reader holding the file makes the
  replace fail; it is retried for about a second, then skipped until the next write.
- **When `run.json` is written:**
  - at the start and at the end;
  - on every phase start and end;
  - on every ES operation, artifact and section;
  - every `heartbeat_s` (10) seconds, from a heartbeat thread.
- **Stale runs:** a run whose `status` is `running` but whose `updated_at` is older than a few
  heartbeats has died without saying so. The dashboard calls it **stale**.
- **`events.jsonl`** is line-buffered, so it can be tailed.
- **Never fatal:** a recording failure never fails the build. An unwritable builds dir means the
  run isn't recorded, and a disk error mid-run stops recording for that process. Both say so in one
  line on stderr. `begin` and `end` always exit 0.
- **Single writer:** each file has one writer (a run writes only its own two files), so nothing
  contends.

## build.json

| Field | Type | Meaning |
|---|---|---|
| `schema_version` | int | `1`. Bumped when a field changes meaning or disappears; additions don't bump it |
| `build_id` | string | `[A-Za-z0-9._-]` |
| `label` | string \| null | `PANGO_BUILD_LABEL` |
| `script` | string | `all`, `index_only` (`run_index_es.sh`), `adhoc` (one run on its own), `backfill` |
| `status` | string | `running`, `ok`, `failed`, `interrupted` (exit 130 or 143), `unknown` |
| `status_reason` | string \| null | For a failure, the last failed run, e.g. `index_es (pango-2): 3 documents failed to load…` |
| `exit_code` | int \| null | The script's |
| `started_at`, `updated_at`, `finished_at` | string \| null | UTC ISO-8601 with milliseconds and `Z` |
| `duration_s` | number \| null | Set when the build ends |
| `as_of` | string | The date the data describes: `started_at`, or the outputs' mtime for a backfill |
| `host` | object | `name`, `platform`, `python` |
| `process` | object | `pid`, `ppid`, `executable`, `argv`, `cwd` (passwords in URIs redacted) |
| `git` | object \| null | `commit`, `short`, `branch`, `dirty` (changed or new files in `loader/src` or `loader/scripts`) |
| `packages` | object | Versions of pandas, numpy, elasticsearch, ijson, requests, pydantic |
| `config` | object | `input_base`, `articles`, `output_dir`, `es_url`, `annotations_index`, `genes_index` (base names, from `.env`) |
| `shared_inputs` | Fingerprint[] | The articles file as it was when the build began |
| `datasets` | Dataset[] | One per dataset folder, in name order |

**Dataset:**

| Field | Meaning |
|---|---|
| `id` | The folder name, also the index prefix and the API version (`pango-2`) |
| `input_dir`, `output_dir` | The folders the steps read and write |
| `release` | `release.json` from the dataset folder if there is one (a planned `get_latest_versions` change), else null |
| `inputs` | Fingerprints of the five input files (`index_only`: the two clean files) |
| `steps` | What the script planned, in order: `all` runs `get_articles`, `clean_annotations`, `generate_gene_annotations`, `report`, `index_es`, `verify`; `index_only` runs `index_es`, `verify` |
| `indexes` | `{annotations, genes}`: the index names `create_index` gives the dataset |

**Fingerprint:** `role`, `path`, `bytes`, `modified_at`, `sha256` and `records`. Any of them can
be null: a missing file, or a count nobody took.

## run.json

| Field | Type | Meaning |
|---|---|---|
| `schema_version`, `run_id`, `build_id` | | As above |
| `step` | string | `get_articles`, `clean_annotations`, `generate_gene_annotations`, `report`, `index_es`, `verify` |
| `dataset` | string \| null | |
| `title` | string | `step · dataset` |
| `status` | string | `running`, `ok`, `failed`, `interrupted` (Ctrl-C, exit 130), `unknown` (exited without saying how) |
| `status_reason` | string \| null | Why it failed, in words: an exception, or the message of `sys.exit("…")` |
| `exit_code` | int \| null | |
| `started_at`, `updated_at`, `finished_at` | string \| null | |
| `duration_s` | number | So far, or in total |
| `heartbeat_s` | number | How often `updated_at` moves while running |
| `process`, `host` | object | As in build.json |
| `config` | object | The step's parsed arguments. Keys like `password` or `token` become `***` |
| `progress` | object \| null | `label`, `done`, `total`, `unit`, `updated_at`. Byte offsets while `index_es` and `report` stream files; NCBI batches in `get_articles` |
| `phases` | Phase[] | Sub-steps in start order: `id`, `name`, `status` (`running`, `ok`, `failed`, `skipped`, `interrupted`), `started_at`, `finished_at`, `duration_s`, `counters`, `error`, `note` |
| `counters` | {name: number} | Run totals. Phase counters roll up into these |
| `breakdowns` | {name: {key: number}} | Totals split by a key |
| `logs` | {warning: Ledger, error: Ledger} | Every WARNING and above, grouped |
| `http` | HttpSummary \| null | Totals over the run's HTTP calls; null if it made none |
| `es` | {server, ops} \| null | The cluster (`name`, `cluster`, `version`) and the operations, capped at 500 |
| `artifacts` | Fingerprint[] | Files the run wrote, with `at` and `phase`. Capped at 200 |
| `sections` | Section[] | Reports attached to the run |
| `dropped` | object | How many of `artifacts`, `es_ops`, `http_events`, `log_events` the caps left out |
| `exception` | {type, message, traceback} \| null | The uncaught exception that ended the run |
| `events` | {file, count} | |

**Ledger:**

- `total` counts every record, including overflow.
- `keys` is the number of distinct keys kept.
- `overflow` counts the records whose key came after the first 100.
- `entries` holds the kept keys, most frequent first. Each entry has `key`, `level`, `logger`,
  `template`, `message` (the first one in full), `count`, `first_at`, `last_at`, and `samples`
  (up to 5 of `{at, message, phase, exception?}`).
- A template blanks the variable parts of a message: `'…'` for quoted values, `<path>` for paths,
  `#` for numbers. So one line repeated for every NCBI batch is one entry.

**HttpSummary:** `calls`, `ok`, `failed`, `items` (ids sent), `unknown` (ids NCBI had no summary
for), `statuses` (`{http status: n}`), `services`, `errors` (`{type: {count, statuses, message}}`),
`latency_ms` (`count`, `mean`, `p50`, `p90`, `max`), `first_at` and `last_at`. Each call is also an
`http` event.

**ES op:** `at`, `op` (`recreate_index`, `bulk`, `refresh`, `count`, `sample_lookups`), `index`,
`status`, `count`, `errors`, `duration_s`, `detail`, `phase`.

**Section** (the same generic shape for every report, so a reader can show a new one without
knowing it):

- `id`, `title`, `status` (`ok`, `absent`, `error`), `message`;
- `headline`: `{label: number | string}`, a row of figures;
- `tables`: `{id, title, columns: [{key, label, kind?: "number"|"text"}], rows, total_rows}`.
  Rows are capped at 1,000, and `total_rows` says how many there were;
- `text`.

## What each step records

Counter names are part of the contract: the dashboard compares builds by them.

| Step | Phases | Counters | Also |
|---|---|---|---|
| `get_articles` | `read_references`, `fetch`, `write` | `references`, `references_non_pmid`, `articles_cached`, `pmids_cached`, `pmids_requested`, `batches`, `batches_failed`, `pmids_failed`, `articles_fetched`, `pmids_unknown`, `articles_out` | `http` (NCBI esummary); a warning per failed batch; the articles file as an artifact (`role: articles`) |
| `clean_annotations` | `load_terms`, `load_articles`, `load_taxa`, `load_genes`, `join`, `write` | `terms`, `articles`, `taxa`, `genes`, `annotations` | Artifact `clean_annotations` |
| `generate_gene_annotations` | `load_hierarchy`, `group`, `write` | `hierarchy_terms`, `hierarchy_edges`, `genes` | Artifact `clean_genes` |
| `report` | `inputs`, `evidence`, `annotations`, `genes` | See below | Breakdowns and the sections `inputs`, `annotations`, `evidence`, `genes`, `consistency` |
| `index_es` | `annotations`, `genes` | `docs_indexed`, `bulk_errors` (both broken down by index type) | `es`: `recreate_index` and `bulk` per index; progress by bytes. A failed document fails its phase, and the run exits 1 |
| `verify` | `cluster`, `files`, `annotations`, `genes`, `samples` | `annotations_expected`, `genes_expected`, `annotations_in_index`, `genes_in_index`, `checks`, `checks_failed` | Section `verification`, a table of every check (`ok`: true, false, or null for information). Breakdown `checks_failed` by index. It exits 0 even when checks fail, unless `--strict` |

**`report` counters.** All are always present, 0 included. The exceptions: `input_articles` and
`references_unresolved` appear only when the articles file was given, and `taxon_id_types_differ`
only when both outputs carry a `taxon_id`.

- **Inputs:** `input_terms`, `input_goslim_terms`, `input_genes`, `input_genes_duplicated`,
  `input_taxa`, `input_hierarchy_edges`, `input_annotations`, `input_articles`.
- **Evidence, from the input annotations:** `evidence`, `references`, `references_non_pmid`,
  `references_unresolved` (PMIDs with no article), `with_genes`, `with_genes_unresolved`, `groups`.
- **Annotations, from the clean output:** `annotations`, `annotations_known_term`,
  `annotations_unknown_term`, `annotations_gene_unresolved` (gene not in the gene info),
  `annotations_without_symbol`, `references_null`, `genes_annotated`, `go_terms`.
- **Genes:** `genes`, `genes_named`, `genes_unnamed`, `genes_with_unknown_terms`, `gene_terms`
  (the sum of `term_count`), `slim_terms`.
- **Checks:** `consistency_checks`, `consistency_failed`, `taxon_id_types_differ`.

**`report` breakdowns:**

- `annotations_by_aspect`, `annotations_by_evidence_type`, `annotations_by_term_type`;
- `annotations_by_evidence` (evidence lines per annotation: `0`, `1`, `2`, `3`, `4-5`, `6-10`, `11+`);
- `evidence_by_group` and `annotations_by_group`: contributing groups, counted as
  `src/analysis/analyze_groups.py` counts them;
- `with_genes_by_taxon`;
- `genes_by_terms` (terms per gene: `1`, `2-5`, `6-10`, `11-20`, `21-50`, `51-100`, `101+`).

The histogram breakdowns list every bucket, zeros included.

## events.jsonl

One object per line: `{seq, at, type, …}`, with `seq` counting from 1.

| `type` | Payload |
|---|---|
| `run.start` | `step`, `dataset`, `build_id` |
| `phase.start` | `phase`, `name` |
| `phase.end` | `phase`, `name`, `status`, `duration_s`, `counters`, `error` |
| `progress` | `label`, `done`, `total`, `unit`, every 5 % of `total` |
| `log` | `level`, `logger`, `message`, `phase`, `key`, `exception` |
| `http` | One call: `service`, `items`, `status`, `outcome` (`ok`, `error`), `latency_ms`, `unknown`, `error_type`, `error`, `phase` |
| `es`, `artifact` | As in run.json |
| `section` | `id`, `title`, `status` |
| `run.end` | `status`, `reason`, `exit_code`, `duration_s` |

`log` events stop after 2,000 per run, except the first record of each new key; `http` events
stop after 2,000. The summaries in run.json still count them all.

## Adding to a record

From any code that runs under an entry point:

```python
from src.build_record import current_run

run = current_run()                        # a no-op stand-in when nothing records
with run.phase('join') as phase:
    phase.count('annotations', len(df))    # also adds to the run's total
run.artifact(path, role='clean_annotations', records=len(df))
run.section('consistency', 'Consistency', headline={...}, tables=[...])
run.log('warning', 'printed, but worth recording')
```

A new entry point wraps itself in `record_run(step=...)`, which records how it ended, including
`sys.exit` codes and exceptions:

```python
if __name__ == "__main__":
    with record_run(step='index_es'):
        main()
```
