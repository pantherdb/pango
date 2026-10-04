"""Builds tests/fixtures/builds from real captures, plus synthetic builds derived from them.

    cd loader
    uv run python ../build-dashboard/tests/fixtures/make_fixtures.py <builds dir>... --scratch <dir>

Each <builds dir> holds real build records: a capture's PANGO_BUILDS_DIR, or loader/builds for
the backfills. One of them must hold a build labelled "pango-1 + pango-2 full-data capture" (both
datasets, every step), which the synthetic builds are derived from. --scratch is the folder the
captures ran in; it becomes /scratch in the records, and the host becomes build-host.

Captures run all.sh on copies of the inputs, against a throwaway Elasticsearch (never :9200 or
loader/downloads): see .plans/feature/build-dashboard.md, Phase 4.

Synthetic builds (times shifted, fields edited):
  - a failed build: pango-2's index_es fails with bulk errors, verify never runs
  - a build with NCBI trouble: failed batches, unresolved PMIDs, 15 % fewer annotations
  - a running build (fresh at FIXTURE_NOW = 2026-10-04T14:00:00Z)
  - a killed build: index_es still says running, hours old
"""

import argparse
import copy
import json
import re
import shutil
import socket
from datetime import datetime, timedelta, timezone
from pathlib import Path

parser = argparse.ArgumentParser(description='Make the dashboard fixtures from real build records')
parser.add_argument('sources', nargs='+', type=Path, help='Builds dirs holding real records')
parser.add_argument('--scratch', type=Path, help='The folder the captures ran in (becomes /scratch)')
parser.add_argument('--out', type=Path, default=Path(__file__).resolve().parent / 'builds')
args = parser.parse_args()

OUT = args.out
SOURCES = args.sources
SCRATCH_PATTERNS = ([re.compile(re.escape(str(args.scratch.resolve())).replace(r'\\', r'[\\/]'), re.I),
                     re.compile(re.escape(args.scratch.resolve().as_posix()), re.I)] if args.scratch else [])
HOST = socket.gethostname()
TIME_KEYS = {'started_at', 'updated_at', 'finished_at', 'at', 'first_at', 'last_at', 'as_of'}
ISO = '%Y-%m-%dT%H:%M:%S.%fZ'


def sanitise(value):
    if isinstance(value, dict):
        return {k: sanitise(v) for k, v in value.items()}
    if isinstance(value, list):
        return [sanitise(v) for v in value]
    if isinstance(value, str):
        for pattern in SCRATCH_PATTERNS:
            value = pattern.sub('/scratch', value)
        return value.replace(HOST, 'build-host').replace('\\', '/') if ('\\' in value or HOST in value) else value
    return value


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')


def write_events(path, events):
    path.write_text(''.join(json.dumps(e, ensure_ascii=False) + '\n' for e in events), encoding='utf-8', newline='\n')


def parse(text):
    return datetime.strptime(text, ISO).replace(tzinfo=timezone.utc)


def iso(moment):
    return moment.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.') + f'{moment.microsecond // 1000:03d}Z'


def shift(value, delta):
    """Move every timestamp field (not file mtimes) by delta."""
    if isinstance(value, dict):
        return {k: (iso(parse(v) + delta) if k in TIME_KEYS and isinstance(v, str) and v.endswith('Z') else shift(v, delta))
                for k, v in value.items()}
    if isinstance(value, list):
        return [shift(v, delta) for v in value]
    return value


# -- the real records --------------------------------------------------------------

if OUT.exists():
    shutil.rmtree(OUT)
for source in SOURCES:
    for build_dir in sorted(d for d in source.iterdir() if d.is_dir()):
        for file in build_dir.rglob('*'):
            if file.is_dir():
                continue
            target = OUT / file.relative_to(source)
            if file.suffix == '.json':
                write(target, sanitise(read(file)))
            elif file.suffix == '.jsonl':
                target.parent.mkdir(parents=True, exist_ok=True)
                write_events(target, [sanitise(json.loads(line)) for line in file.read_text(encoding='utf-8').splitlines() if line.strip()])

full = next(d for d in OUT.iterdir() if read(d / 'build.json')['label'].startswith('pango-1 + pango-2'))
full_build = read(full / 'build.json')
full_runs = {(r['dataset'], r['step']): (r, d) for d in (full / 'runs').iterdir() for r in [read(d / 'run.json')]}


def events_of(run_dir):
    return [json.loads(line) for line in (run_dir / 'events.jsonl').read_text(encoding='utf-8').splitlines()]


def synthetic_build(build_id, label, start, datasets, status, exit_code, reason, finished):
    build = copy.deepcopy(full_build)
    delta = start - parse(build['started_at'])
    build = shift(build, delta)
    build.update(build_id=build_id, label=label, status=status, exit_code=exit_code, status_reason=reason,
                 started_at=iso(start), as_of=iso(start), finished_at=iso(finished) if finished else None,
                 updated_at=iso(finished or start), duration_s=round((finished - start).total_seconds(), 3) if finished else None)
    build['datasets'] = [d for d in build['datasets'] if d['id'] in datasets]
    write(OUT / build_id / 'build.json', build)
    return build


def copy_run(build_id, dataset, step, start, edit=None, events_edit=None):
    """A real run of the full capture, moved into a synthetic build to start at `start`."""
    original, run_dir = full_runs[(dataset, step)]
    delta = start - parse(original['started_at'])
    run = shift(copy.deepcopy(original), delta)
    stamp = start.strftime('%Y%m%dT%H%M%SZ')
    run['build_id'] = build_id
    run['run_id'] = f'{stamp}-{step}-{dataset}-{run["process"]["pid"]}-5e7a'
    events = shift(events_of(run_dir), delta)
    for event in events:
        if event['type'] == 'run.start':
            event['build_id'] = build_id
    if edit:
        edit(run)
    if events_edit:
        events = events_edit(run, events)
    run['events']['count'] = len(events)
    target = OUT / build_id / 'runs' / run['run_id']
    write(target / 'run.json', run)
    write_events(target / 'events.jsonl', events)
    return run, parse(run['finished_at'] or run['updated_at'])


def chain(build_id, dataset, steps, start, edits=None):
    """Runs one after the other, 2 s apart, as all.sh starts them."""
    edits = edits or {}
    at = start
    runs = []
    for step in steps:
        run, ended = copy_run(build_id, dataset, step, at, *edits.get(step, (None, None)))
        runs.append(run)
        at = ended + timedelta(seconds=2)
    return runs, at


ALL_STEPS = ['get_articles', 'clean_annotations', 'generate_gene_annotations', 'report', 'index_es', 'verify']

# 1. A failed build: pango-2's index_es loses 3 documents; verify never runs.
def fail_index(run):
    run['status'], run['exit_code'] = 'failed', 1
    run['status_reason'] = '3 documents failed to load, so the indexes are incomplete; see logfile.log'
    run['counters']['bulk_errors'] = 3
    run['counters']['docs_indexed'] -= 3
    run['breakdowns']['bulk_errors'] = {'annotations': 3, 'genes': 0}
    run['breakdowns']['docs_indexed']['annotations'] -= 3
    phase = run['phases'][0]
    phase['status'], phase['error'] = 'failed', '3 documents failed to load'
    phase['counters']['bulk_errors'] = 3
    bulk = next(op for op in run['es']['ops'] if op['op'] == 'bulk')
    bulk['status'], bulk['errors'] = 'failed', 3
    bulk['count'] -= 3
    message = ('pango-2-pango-annotations: document {} (status 400): mapper_parsing_exception: failed to parse '
               "field [coordinates_start] of type [float] in document with id '{}'")
    samples = [{'at': phase['finished_at'], 'message': message.format(i, i), 'phase': 'annotations'} for i in ('a1', 'b7', 'q9')]
    run['logs']['error'] = {'total': 4, 'keys': 2, 'overflow': 0, 'entries': [
        {'key': 'ERROR|src.index_es|' + 'x', 'level': 'ERROR', 'logger': 'src.index_es',
         'template': "<path>: document # (status #): mapper_parsing_exception: failed to parse field [coordinates_start] of type [float] in document with id '…'",
         'message': samples[0]['message'], 'count': 3, 'first_at': phase['finished_at'], 'last_at': phase['finished_at'], 'samples': samples},
        {'key': 'ERROR|src.index_es|y', 'level': 'ERROR', 'logger': 'src.index_es',
         'template': '# documents failed to load into pango-#-pango-annotations',
         'message': '3 documents failed to load into pango-2-pango-annotations', 'count': 1,
         'first_at': phase['finished_at'], 'last_at': phase['finished_at'],
         'samples': [{'at': phase['finished_at'], 'message': '3 documents failed to load into pango-2-pango-annotations', 'phase': 'annotations'}]},
    ]}
    run['logs']['warning'] = {'total': 1, 'keys': 1, 'overflow': 0, 'entries': [
        {'key': 'WARNING|src.index_es|Annotations loading had # errors', 'level': 'WARNING', 'logger': 'src.index_es',
         'template': 'Annotations loading had # errors', 'message': 'Annotations loading had 3 errors', 'count': 1,
         'first_at': phase['finished_at'], 'last_at': phase['finished_at'],
         'samples': [{'at': phase['finished_at'], 'message': 'Annotations loading had 3 errors', 'phase': 'annotations'}]}]}


def fail_index_events(run, events):
    end = events[-1]
    end.update(status='failed', reason=run['status_reason'], exit_code=1)
    return events


start = datetime(2026, 10, 4, 11, 0, tzinfo=timezone.utc)
b1 = '20261004T110000Z-all-f41d'
_, at = chain(b1, 'pango-1', ALL_STEPS, start + timedelta(seconds=2))
_, ended = chain(b1, 'pango-2', ALL_STEPS[:5], at, {'index_es': (fail_index, fail_index_events)})
synthetic_build(b1, 'Failed build (synthetic)', start, ['pango-1', 'pango-2'], 'failed', 1,
                'index_es (pango-2): 3 documents failed to load, so the indexes are incomplete; see logfile.log', ended)

# 2. NCBI trouble on pango-1: two failed batches, PMIDs without articles, 15 % fewer annotations.
def ncbi_trouble(run):
    run['counters'].update(pmids_requested=200, batches=2, batches_failed=2, pmids_failed=200)
    run['phases'][1]['counters'] = {'batches': 2, 'batches_failed': 2, 'pmids_failed': 200}
    run['http'] = {'calls': 2, 'ok': 0, 'failed': 2, 'items': 200, 'unknown': 0, 'statuses': {'503': 2},
                   'services': {'ncbi-esummary': 2},
                   'errors': {'HTTPError': {'count': 2, 'statuses': {'503': 2}, 'message': '503 Server Error: Service Unavailable'}},
                   'latency_ms': {'count': 2, 'mean': 30012.5, 'p50': 30001.0, 'p90': 30024.0, 'max': 30024.0},
                   'first_at': run['phases'][1]['started_at'], 'last_at': run['phases'][1]['finished_at']}
    message = 'NCBI batch {}-{} failed and was skipped: 503 Server Error: Service Unavailable'
    at = run['phases'][1]['finished_at']
    run['logs']['warning'] = {'total': 2, 'keys': 1, 'overflow': 0, 'entries': [
        {'key': 'WARNING|loader|NCBI batch #-# failed and was skipped: # Server Error: Service Unavailable',
         'level': 'WARNING', 'logger': 'loader',
         'template': 'NCBI batch #-# failed and was skipped: # Server Error: Service Unavailable',
         'message': message.format(0, 100), 'count': 2, 'first_at': at, 'last_at': at,
         'samples': [{'at': at, 'message': message.format(0, 100), 'phase': 'fetch'},
                     {'at': at, 'message': message.format(100, 200), 'phase': 'fetch'}]}]}


def ncbi_events(run, events):
    at = run['phases'][1]['finished_at']
    extra = [{'seq': 0, 'at': at, 'type': 'http', 'service': 'ncbi-esummary', 'items': 100, 'status': 503, 'outcome': 'error',
              'latency_ms': 30001.0 + 23 * i, 'unknown': 0, 'error_type': 'HTTPError',
              'error': '503 Server Error: Service Unavailable', 'phase': 'fetch'} for i in range(2)]
    merged = events[:3] + extra + events[3:]
    for seq, event in enumerate(merged, 1):
        event['seq'] = seq
    return merged


def fewer_annotations(run):
    c = run['counters']
    c['references_unresolved'] = 200
    for name in ('annotations', 'annotations_known_term', 'input_annotations', 'evidence'):
        c[name] = round(c[name] * 0.85)
    for name, values in run['breakdowns'].items():
        if name.startswith('annotations_by_') and name not in ('annotations_by_evidence',):
            run['breakdowns'][name] = {k: round(v * 0.85) for k, v in values.items()}
    for section in run['sections']:
        if section['id'] == 'evidence':
            section['headline']['PMIDs without an article'] = 200
            section['headline']['Evidence lines'] = c['evidence']
        if section['id'] == 'inputs':
            section['headline']['Annotations in'] = c['input_annotations']
        if section['id'] == 'annotations':
            section['headline']['Annotations'] = c['annotations']
            for table in section['tables']:
                for row in table['rows']:
                    row['annotations'] = round(row['annotations'] * 0.85)
        if section['id'] == 'consistency':
            for row in section['tables'][0]['rows']:
                if row['check'].startswith('Every input annotation'):
                    row['expected'] = row['actual'] = c['annotations']


def verify_fewer(run):
    c = run['counters']
    c['annotations_expected'] = c['annotations_in_index'] = round(c['annotations_expected'] * 0.85)


start = datetime(2026, 10, 4, 12, 30, tzinfo=timezone.utc)
b2 = '20261004T123000Z-all-9c2e'
_, ended = chain(b2, 'pango-1', ALL_STEPS, start + timedelta(seconds=2), {
    'get_articles': (ncbi_trouble, ncbi_events),
    'report': (fewer_annotations, None),
    'verify': (verify_fewer, None),
})
synthetic_build(b2, 'NCBI trouble (synthetic)', start, ['pango-1'], 'ok', 0, None, ended)

# 3. A running build: pango-1's clean_annotations is half-way, its record 5 s old at FIXTURE_NOW.
FIXTURE_NOW = datetime(2026, 10, 4, 14, 0, tzinfo=timezone.utc)


def still_running(updated):
    def edit(run):
        run.update(status='running', status_reason=None, exit_code=None, finished_at=None, updated_at=iso(updated))
        run['duration_s'] = round((updated - parse(run['started_at'])).total_seconds(), 3)
        run['artifacts'] = []
        for phase in run['phases'][4:]:
            phase.update(status='running', finished_at=None, duration_s=None, counters={})
        run['phases'] = run['phases'][:5]
        run['counters'] = {k: v for k, v in run['counters'].items() if k != 'annotations'}
    return edit


def drop_end(run, events):
    return [e for e in events if e['type'] not in ('run.end', 'artifact') and not (e['type'] == 'phase.end' and e['name'] in ('join', 'write'))
            and not (e['type'] == 'phase.start' and e['name'] == 'write')]


start = FIXTURE_NOW - timedelta(minutes=3)
b3 = '20261004T135700Z-all-7a10'
first, at = chain(b3, 'pango-1', ['get_articles'], start + timedelta(seconds=2))
copy_run(b3, 'pango-1', 'clean_annotations', at, still_running(FIXTURE_NOW - timedelta(seconds=5)), drop_end)
build = synthetic_build(b3, 'Running build (synthetic)', start, ['pango-1', 'pango-2'], 'running', None, None, None)

# 4. A killed build: pango-2's index_es says it is running, but nothing has moved for hours.
def killed(run):
    updated = parse(run['started_at']) + timedelta(seconds=31)
    run.update(status='running', status_reason=None, exit_code=None, finished_at=None, updated_at=iso(updated), duration_s=31.0)
    run['phases'][0].update(status='running', finished_at=None, duration_s=None, counters={})
    run['phases'] = run['phases'][:1]
    run['es']['ops'] = run['es']['ops'][:1]
    run['counters'] = {}
    run['breakdowns'] = {}
    run['progress'] = {'label': 'annotations', 'done': 150208512, 'total': 366451736, 'unit': 'bytes', 'updated_at': iso(updated)}


def killed_events(run, events):
    return [e for e in events[:4]]


start = datetime(2026, 10, 4, 10, 0, tzinfo=timezone.utc)
b4 = '20261004T100000Z-all-5e0b'
_, at = chain(b4, 'pango-2', ALL_STEPS[:4], start + timedelta(seconds=2))
copy_run(b4, 'pango-2', 'index_es', at, killed, killed_events)
synthetic_build(b4, 'Killed build (synthetic)', start, ['pango-2'], 'running', None, None, None)

for build_dir in sorted(OUT.iterdir()):
    b = read(build_dir / 'build.json')
    print(f"{b['build_id']:<34} {b['script']:<9} {b['status']:<8} {len(list((build_dir / 'runs').iterdir())):>2} runs  {b['label']}")
