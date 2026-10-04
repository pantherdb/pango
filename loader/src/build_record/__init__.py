"""Build records: what each loader build did, written while it runs.

A build is one all.sh (or run_index_es.sh) invocation; a run is one step process for
one dataset. They are written to:

    <builds dir>/<build id>/build.json                   the build: plan, inputs, outcome
    <builds dir>/<build id>/runs/<run id>/run.json       a snapshot of one run
    <builds dir>/<build id>/runs/<run id>/events.jsonl   its append-only timeline

A step's entry point opens its run, and code below it reports through `current_run()`:

    with record_run(step='index_es') as run:
        with run.phase('annotations') as phase:
            phase.count('docs_indexed', n, by='annotations')

`build-dashboard/` reads the records. The format is `loader/docs/build-record.md`.

Environment: PANGO_BUILDS_DIR (default loader/builds/), PANGO_BUILD_ID (set by the
scripts), PANGO_DATASET, PANGO_BUILD_LABEL, and PANGO_RECORD=0 to turn recording off.
"""

from .build import begin_build, end_build, find_runs
from .fingerprint import count_json_items, file_fingerprint
from .paths import SCHEMA_VERSION
from .recorder import HEARTBEAT_S, NULL_RUN, NullRun, RunRecorder, current_run, record_run, start_run

__all__ = [
    'HEARTBEAT_S',
    'NULL_RUN',
    'SCHEMA_VERSION',
    'NullRun',
    'RunRecorder',
    'begin_build',
    'count_json_items',
    'current_run',
    'end_build',
    'file_fingerprint',
    'find_runs',
    'record_run',
    'start_run',
]
