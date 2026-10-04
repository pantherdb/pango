"""The run recorder: one per step process, writing run.json and events.jsonl as it goes.

A step's entry point opens the run with `record_run(step=...)`. Code below it reports
through `current_run()`, which returns a no-op `NullRun` when nothing records, so
instrumented code never has to check.

Runs belong to the build that PANGO_BUILD_ID names (all.sh sets it). A run started
without one, or whose build.json is missing, makes a build of its own.

Recording is best-effort: nothing here may fail a step. An I/O error stops recording
for the process with one line on stderr.

Locking: one re-entrant lock guards every change and every write. Nothing logs while
holding it, so the heartbeat thread and a logging call on another thread can't
deadlock on it.
"""

import atexit
import logging
import os
import sys
import threading
import time
import traceback
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional, Tuple, Union

from . import build as builds
from .fingerprint import file_fingerprint
from .ledger import Ledger, RecordingHandler, record_exception, record_message
from .paths import (
    SCHEMA_VERSION,
    build_id_from_env,
    builds_dir,
    env_text,
    iso,
    new_build_id,
    new_run_id,
    recording_enabled,
    utc_now,
)
from .provenance import clean_config, host_info, process_info
from .storage import EventWriter, write_json_atomic

HEARTBEAT_S = 10
MAX_ARTIFACTS = 200
MAX_ES_OPS = 500
MAX_HTTP_EVENTS = 2000
MAX_LOG_EVENTS = 2000
MAX_TABLE_ROWS = 1000
MAX_TEXT = 20_000
MAX_REASON = 500
MAX_EXCEPTION = 8000
# A progress event goes to events.jsonl every 5 % of the total; run.json always has the latest.
PROGRESS_EVENT_STEP = 0.05

RUN_STATUSES = ('running', 'ok', 'failed', 'interrupted', 'unknown')
PHASE_STATUSES = ('running', 'ok', 'failed', 'skipped', 'interrupted')


def _stderr(message: str) -> None:
    try:
        print(f'build_record: {message}', file=sys.stderr)
    except Exception:
        pass


def is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _latency(values: List[float]) -> Optional[dict]:
    if not values:
        return None
    ordered = sorted(values)

    def percentile(p: float) -> float:
        return round(ordered[min(len(ordered) - 1, int(round(p * (len(ordered) - 1))))], 1)

    return {'count': len(ordered), 'mean': round(sum(ordered) / len(ordered), 1),
            'p50': percentile(0.5), 'p90': percentile(0.9), 'max': round(ordered[-1], 1)}


class HttpLedger:
    """Totals over a run's HTTP calls (NCBI esummary, today); each call is also an event."""

    def __init__(self):
        self.calls = 0
        self.ok = 0
        self.failed = 0
        self.items = 0
        self.unknown = 0
        self.latencies: List[float] = []
        self.statuses: Dict[str, int] = {}
        self.services: Dict[str, int] = {}
        self.errors: Dict[str, dict] = {}
        self.first_at: Optional[str] = None
        self.last_at: Optional[str] = None

    def add(self, call: dict) -> None:
        self.calls += 1
        ok = call.get('outcome') == 'ok'
        self.ok += ok
        self.failed += not ok
        self.items += int(call.get('items') or 0)
        self.unknown += int(call.get('unknown') or 0)
        if is_number(call.get('latency_ms')):
            self.latencies.append(float(call['latency_ms']))
        status = call.get('status')
        if status is not None:
            self.statuses[str(status)] = self.statuses.get(str(status), 0) + 1
        service = str(call.get('service') or 'http')
        self.services[service] = self.services.get(service, 0) + 1
        if not ok:
            group = self.errors.setdefault(str(call.get('error_type') or 'Error'),
                                           {'count': 0, 'statuses': {}, 'message': call.get('error')})
            group['count'] += 1
            if status is not None:
                group['statuses'][str(status)] = group['statuses'].get(str(status), 0) + 1
        at = call.get('at')
        if at:
            self.first_at = self.first_at or at
            self.last_at = at

    def to_dict(self) -> Optional[dict]:
        if not self.calls:
            return None
        return {
            'calls': self.calls,
            'ok': self.ok,
            'failed': self.failed,
            'items': self.items,
            'unknown': self.unknown,
            'statuses': dict(self.statuses),
            'services': dict(self.services),
            'errors': {k: dict(v) for k, v in self.errors.items()},
            'latency_ms': _latency(self.latencies),
            'first_at': self.first_at,
            'last_at': self.last_at,
        }


class Phase:
    """An open phase (a sub-step of the run); `RunRecorder.phase()` yields one."""

    def __init__(self, run: 'RunRecorder', record: dict):
        self._run = run
        self.record = record

    @property
    def id(self) -> str:
        return self.record['id']

    def count(self, name: str, value: Any = 1, *, by: Optional[str] = None) -> None:
        """Add to this phase's counter and to the run's total (and its breakdown `by`)."""
        self._run._count(name, value, by=by, phase=self.record)

    def note(self, text: str) -> None:
        self.record['note'] = str(text)[:MAX_REASON]

    def fail(self, reason: str) -> None:
        """Mark the phase failed when it ends, without raising."""
        self.record['_forced'] = ('failed', reason)

    def skip(self, reason: Optional[str] = None) -> None:
        self.record['_forced'] = ('skipped', reason)

    def end(self, status: Optional[str] = None, error: Any = None) -> None:
        self._run._end_phase(self.record, status, error)


def _clip_rows(rows: Optional[list]) -> Optional[list]:
    if rows is None:
        return None
    return [clean_config(row) for row in rows[:MAX_TABLE_ROWS]]


def _clip_table(table: dict) -> dict:
    rows = table.get('rows') or []
    return {
        'id': table.get('id'),
        'title': table.get('title'),
        'columns': clean_config(table.get('columns') or []),
        'rows': _clip_rows(rows),
        'total_rows': table.get('total_rows', len(rows)),
    }


def _exit_status(code: Any) -> Tuple[str, Optional[str], int]:
    """(status, reason, exit code) for a SystemExit code: 0 ok, 130 interrupted, else failed.

    `sys.exit('message')` prints the message and exits 1; the message is the reason.
    """
    if code is None or code == 0:
        return 'ok', None, 0
    if not isinstance(code, int):
        return 'failed', str(code)[:MAX_REASON], 1
    if code == 130:
        return 'interrupted', 'Interrupted', 130
    return 'failed', f'Exited with code {code}', code


class RunRecorder:
    """Everything one step process did, persisted as it happens."""

    enabled = True

    def __init__(self, *, step: str, dataset: Optional[str] = None, title: Optional[str] = None,
                 config: Optional[dict] = None, build_id: Optional[str] = None,
                 root: Optional[Path] = None, build_script: str = 'adhoc',
                 heartbeat_s: float = HEARTBEAT_S):
        self.pid = os.getpid()
        self.started = utc_now()
        self._t0 = time.perf_counter()
        self.step = step
        self.dataset = dataset
        self._title = title
        self.root = root or builds_dir()
        self.heartbeat_s = heartbeat_s
        build_id = build_id or build_id_from_env()
        # A build id whose build.json is missing (its `begin` failed, or another runs dir):
        # the run makes a build of its own rather than leave an orphan.
        if build_id and not (builds.build_dir(build_id, self.root) / builds.BUILD_FILE).is_file():
            build_id = None
        self.owns_build = build_id is None
        self.build_script = build_script
        self.build_id = build_id or new_build_id(step, self.started)
        self.run_id = new_run_id(step, dataset, self.started, self.pid)
        self.dir = builds.build_dir(self.build_id, self.root) / 'runs' / self.run_id
        self.finished = False
        # For a run that is its own build: the date its data describes (a backfill), and
        # the dataset folders it read.
        self.as_of: Optional[str] = None
        self.dataset_dirs: Optional[dict] = None

        self._lock = threading.RLock()
        self._status = 'running'
        self._status_reason: Optional[str] = None
        self._exit_code: Optional[int] = None
        self._finished_at = None
        self._exception: Optional[dict] = None
        self._config = clean_config(config or {})
        self._process = process_info()
        self._host = host_info()
        self._phases: List[dict] = []
        self._stack: List[dict] = []
        self._next_phase = 1
        self._counters: Dict[str, Any] = {}
        self._breakdowns: Dict[str, Dict[str, Any]] = {}
        self._progress: Optional[dict] = None
        self._progress_mark = 0.0
        self._logs = Ledger()
        self._log_events = 0
        self._http = HttpLedger()
        self._http_events = 0
        self._es_server: Optional[dict] = None
        self._es_ops: List[dict] = []
        self._artifacts: List[dict] = []
        self._sections: List[dict] = []
        self._dropped = {'artifacts': 0, 'es_ops': 0, 'http_events': 0, 'log_events': 0}
        self._events: Optional[EventWriter] = None
        self._seq = 0

        self.dir.mkdir(parents=True, exist_ok=True)
        if self.owns_build:
            builds.write_own_build(self)
        self._events = EventWriter(self.dir / 'events.jsonl')
        self._event('run.start', {'step': step, 'dataset': dataset, 'build_id': self.build_id})
        self._flush()

        self._handler = RecordingHandler(self._on_log, self.pid)
        logging.getLogger().addHandler(self._handler)
        self._stop = threading.Event()
        self._heartbeat = threading.Thread(target=self._beat, name='build-record-heartbeat',
                                           daemon=True)
        self._heartbeat.start()

    @property
    def title(self) -> str:
        if self._title:
            return self._title
        return f'{self.step} · {self.dataset}' if self.dataset else self.step

    def set_config(self, config: Optional[dict] = None, *, dataset: Optional[str] = None,
                   title: Optional[str] = None) -> None:
        """What the run was asked to do, once its arguments are parsed."""
        with self._lock:
            if config is not None:
                self._config = clean_config(config)
            if dataset:
                self.dataset = dataset
            if title:
                self._title = title
            self._flush()

    def set_as_of(self, moment: str) -> None:
        self.as_of = moment

    def set_dataset_dirs(self, *, input_dir: Optional[str] = None,
                         output_dir: Optional[str] = None) -> None:
        self.dataset_dirs = {'input_dir': input_dir, 'output_dir': output_dir}

    # -- phases --------------------------------------------------------------------

    @contextmanager
    def phase(self, name: str) -> Iterator[Phase]:
        handle = self.phase_begin(name)
        try:
            yield handle
        except KeyboardInterrupt:
            handle.end('interrupted', 'Interrupted')
            raise
        except SystemExit as exc:
            status, reason, _ = _exit_status(exc.code)
            handle.end('interrupted' if status == 'interrupted' else status, reason)
            raise
        except BaseException as exc:
            handle.end('failed', f'{type(exc).__name__}: {exc}')
            raise
        else:
            handle.end()

    def phase_begin(self, name: str) -> Phase:
        with self._lock:
            record = {
                'id': f'p{self._next_phase}',
                'name': name,
                'status': 'running',
                'started_at': iso(utc_now()),
                'finished_at': None,
                'duration_s': None,
                'counters': {},
                'error': None,
                'note': None,
                '_t0': time.perf_counter(),
            }
            self._next_phase += 1
            self._phases.append(record)
            self._stack.append(record)
            self._event('phase.start', {'phase': record['id'], 'name': name})
            self._flush()
            return Phase(self, record)

    def _end_phase(self, record: dict, status: Optional[str], error: Any) -> None:
        with self._lock:
            if record['status'] != 'running':
                return
            forced = record.pop('_forced', None)
            reason = error
            if status is None:
                status, reason = forced if forced else ('ok', None)
            elif forced and reason is None:
                reason = forced[1]
            started = record.pop('_t0', None)
            record['status'] = status if status in PHASE_STATUSES else 'failed'
            record['finished_at'] = iso(utc_now())
            record['duration_s'] = round(time.perf_counter() - started, 3) if started else None
            record['error'] = str(reason)[:MAX_REASON * 4] if reason else None
            if record in self._stack:
                self._stack.remove(record)
            self._event('phase.end', {'phase': record['id'], 'name': record['name'],
                                      'status': record['status'], 'duration_s': record['duration_s'],
                                      'counters': record['counters'], 'error': record['error']})
            self._flush()

    def current_phase(self) -> Optional[dict]:
        with self._lock:
            return self._stack[-1] if self._stack else None

    def _phase_name(self) -> Optional[str]:
        phase = self.current_phase()
        return phase['name'] if phase else None

    # -- counters and progress -----------------------------------------------------

    def count(self, name: str, value: Any = 1, *, by: Optional[str] = None) -> None:
        self._count(name, value, by=by, phase=None)

    def _count(self, name: str, value: Any, *, by: Optional[str], phase: Optional[dict]) -> None:
        if not is_number(value):
            return
        with self._lock:
            if phase is not None:
                phase['counters'][name] = phase['counters'].get(name, 0) + value
            self._counters[name] = self._counters.get(name, 0) + value
            if by is not None:
                breakdown = self._breakdowns.setdefault(name, {})
                breakdown[str(by)] = breakdown.get(str(by), 0) + value

    def set_counters(self, values: Dict[str, Any]) -> None:
        """Set totals computed elsewhere (a report's figures), replacing any so far."""
        with self._lock:
            self._counters.update({k: v for k, v in values.items() if is_number(v)})

    def set_breakdown(self, name: str, values: Dict[Any, Any]) -> None:
        with self._lock:
            self._breakdowns[name] = {str(k): v for k, v in values.items() if is_number(v)}

    def progress(self, done: Any, total: Any = None, *, label: Optional[str] = None,
                 unit: Optional[str] = None) -> None:
        """How far the current piece of work is; arguments left out keep their last value."""
        if not is_number(done):
            return
        with self._lock:
            current = self._progress or {'label': None, 'done': 0, 'total': None, 'unit': None}
            if label is not None and label != current['label']:
                current = {'label': label, 'done': 0, 'total': None, 'unit': None}
                self._progress_mark = 0.0
            current['done'] = done
            if total is not None:
                current['total'] = total
            if unit is not None:
                current['unit'] = unit
            current['updated_at'] = iso(utc_now())
            self._progress = current
            total_now = current['total']
            if is_number(total_now) and total_now > 0:
                fraction = done / total_now
                if fraction >= self._progress_mark + PROGRESS_EVENT_STEP or done >= total_now:
                    self._progress_mark = fraction
                    self._event('progress', {k: v for k, v in current.items() if k != 'updated_at'})

    # -- http, elasticsearch, files, reports -------------------------------------

    def http(self, call: dict) -> None:
        call = {'at': iso(utc_now()), **call, 'phase': self._phase_name()}
        with self._lock:
            self._http.add(call)
            if self._http_events < MAX_HTTP_EVENTS:
                self._http_events += 1
                self._event('http', call)
            else:
                self._dropped['http_events'] += 1

    def es_server(self, info: dict) -> None:
        with self._lock:
            self._es_server = clean_config(info)
            self._flush()

    def es_op(self, op: str, *, index: Optional[str] = None, status: str = 'ok',
              count: Optional[int] = None, errors: Optional[int] = None,
              duration_s: Optional[float] = None, detail: Optional[str] = None) -> None:
        record = {
            'at': iso(utc_now()),
            'op': op,
            'index': index,
            'status': status,
            'count': count,
            'errors': errors,
            'duration_s': round(duration_s, 3) if is_number(duration_s) else None,
            'detail': str(detail)[:MAX_REASON * 4] if detail else None,
            'phase': self._phase_name(),
        }
        with self._lock:
            if len(self._es_ops) >= MAX_ES_OPS:
                self._dropped['es_ops'] += 1
                return
            self._es_ops.append(record)
            self._event('es', record)
            self._flush()

    def artifact(self, path: Any, *, role: str, records: Optional[int] = None,
                 sha256: bool = True) -> None:
        """A file the run wrote, with its size, checksum and record count."""
        record = {'at': iso(utc_now()),
                  **file_fingerprint(path, role=role, sha256=sha256, records=records),
                  'phase': self._phase_name()}
        with self._lock:
            if len(self._artifacts) >= MAX_ARTIFACTS:
                self._dropped['artifacts'] += 1
                return
            self._artifacts.append(record)
            self._event('artifact', record)
            self._flush()

    def section(self, section_id: str, title: str, *, headline: Optional[dict] = None,
                tables: Optional[list] = None, text: Optional[str] = None, status: str = 'ok',
                message: Optional[str] = None) -> None:
        """A report attached to the run: headline figures, tables and text.

        The same generic shape whatever the report, so a reader can show a new one
        without knowing it.
        """
        record = {
            'id': section_id,
            'title': title,
            'status': status,
            'message': message,
            'headline': clean_config(headline) if headline else None,
            'tables': [_clip_table(t) for t in tables or []],
            'text': text[:MAX_TEXT] if text else None,
        }
        with self._lock:
            self._sections = [s for s in self._sections if s['id'] != section_id] + [record]
            self._event('section', {'id': section_id, 'title': title, 'status': status})
            self._flush()

    # -- warnings and errors -------------------------------------------------------

    def log(self, level: str, message: str, *, logger: str = 'loader',
            exception: Optional[str] = None) -> None:
        """Record a warning or error a step only prints, as if it had been logged."""
        level = str(level).upper()
        self._record_log(level if level in ('ERROR', 'CRITICAL') else 'WARNING', logger,
                         str(message), exception)

    def _on_log(self, record: logging.LogRecord) -> None:
        self._record_log(record.levelname, record.name, record_message(record),
                         record_exception(record))

    def _record_log(self, level: str, logger: str, message: str,
                    exception: Optional[str]) -> None:
        phase = self._phase_name()
        with self._lock:
            entry, sampled = self._logs.add(level=level, logger=logger, message=message,
                                            at=iso(utc_now()), phase=phase, exception=exception)
            if self._log_events < MAX_LOG_EVENTS or (entry is not None and entry['count'] == 1):
                self._log_events += 1
                self._event('log', {'level': level, 'logger': logger, 'message': message[:2000],
                                    'phase': phase, 'key': entry['key'] if entry else None,
                                    'exception': exception if sampled else None})
            else:
                self._dropped['log_events'] += 1

    # -- finishing -----------------------------------------------------------------

    def finish(self, status: str = 'ok', *, reason: Optional[str] = None,
               exit_code: Optional[int] = None) -> None:
        with self._lock:
            if self.finished:
                return
            status = status if status in RUN_STATUSES and status != 'running' else 'unknown'
            open_status = ('ok' if status == 'ok'
                           else 'interrupted' if status == 'interrupted' else 'failed')
            for record in reversed(list(self._stack)):
                self._end_phase(record, open_status, None if status == 'ok' else reason)
            self._status = status
            self._status_reason = str(reason)[:MAX_REASON] if reason else None
            self._exit_code = exit_code
            self._finished_at = utc_now()
            self.finished = True
            self._event('run.end', {'status': status, 'reason': self._status_reason,
                                    'exit_code': exit_code,
                                    'duration_s': round(time.perf_counter() - self._t0, 3)})
            self._stop.set()
            logging.getLogger().removeHandler(self._handler)
            self._flush()
            if self.owns_build and self.enabled:
                try:
                    builds.finish_own_build(self, self.snapshot())
                except Exception as exc:
                    _stderr(f'could not close build {self.build_id} ({type(exc).__name__}: {exc})')
            if self._events is not None:
                self._events.close()
                self._events = None
        atexit.unregister(self._atexit)
        _deactivate(self)

    def fail_with_exception(self, exc: BaseException) -> None:
        interrupted = isinstance(exc, KeyboardInterrupt)
        with self._lock:
            self._exception = {
                'type': type(exc).__name__,
                'message': str(exc)[:MAX_REASON * 4],
                'traceback': ''.join(traceback.format_exception(type(exc), exc,
                                                                exc.__traceback__))[-MAX_EXCEPTION:],
            }
        reason = f'{type(exc).__name__}: {exc}' if str(exc) else type(exc).__name__
        self.finish('interrupted' if interrupted else 'failed',
                    reason='Interrupted' if interrupted else reason,
                    exit_code=130 if interrupted else 1)

    def _atexit(self) -> None:
        if os.getpid() == self.pid and not self.finished:
            self.finish('unknown', reason='The process exited without recording an outcome.')

    # -- persistence ---------------------------------------------------------------

    def _event(self, kind: str, payload: dict) -> None:
        if self._events is None or not self.enabled:
            return
        self._seq += 1
        try:
            self._events.write({'seq': self._seq, 'at': iso(utc_now()), 'type': kind, **payload})
        except OSError as exc:
            self._disable(exc)

    def _beat(self) -> None:
        while not self._stop.wait(self.heartbeat_s):
            with self._lock:
                if self.finished:
                    return
                self._flush()

    def _flush(self) -> None:
        if not self.enabled:
            return
        with self._lock:
            try:
                write_json_atomic(self.dir / 'run.json', self.snapshot())
            except PermissionError:
                pass  # a reader held the file through every retry; the next flush tries again
            except OSError as exc:
                self._disable(exc)

    def _disable(self, exc: BaseException) -> None:
        if self.enabled:
            self.enabled = False
            _stderr(f'recording stopped for this process ({type(exc).__name__}: {exc})')

    def snapshot(self) -> dict:
        with self._lock:
            now = utc_now()
            end = self._finished_at or now
            return {
                'schema_version': SCHEMA_VERSION,
                'run_id': self.run_id,
                'build_id': self.build_id,
                'step': self.step,
                'dataset': self.dataset,
                'title': self.title,
                'status': self._status,
                'status_reason': self._status_reason,
                'exit_code': self._exit_code,
                'started_at': iso(self.started),
                'updated_at': iso(now),
                'finished_at': iso(self._finished_at) if self._finished_at else None,
                'duration_s': round((end - self.started).total_seconds(), 3),
                'heartbeat_s': self.heartbeat_s,
                'process': self._process,
                'host': self._host,
                'config': self._config,
                'progress': dict(self._progress) if self._progress else None,
                'phases': [{k: v for k, v in p.items() if not k.startswith('_')}
                           for p in self._phases],
                'counters': dict(self._counters),
                'breakdowns': {k: dict(v) for k, v in self._breakdowns.items()},
                'logs': self._logs.to_dict(),
                'http': self._http.to_dict(),
                'es': ({'server': self._es_server, 'ops': list(self._es_ops)}
                       if self._es_server or self._es_ops else None),
                'artifacts': list(self._artifacts),
                'sections': list(self._sections),
                'dropped': dict(self._dropped),
                'exception': self._exception,
                'events': {'file': 'events.jsonl', 'count': self._seq},
            }


# -- the process's one run ----------------------------------------------------------

class _NullPhase:
    id = None
    record: dict = {}

    def count(self, *_: Any, **__: Any) -> None: ...
    def note(self, *_: Any, **__: Any) -> None: ...
    def fail(self, *_: Any, **__: Any) -> None: ...
    def skip(self, *_: Any, **__: Any) -> None: ...
    def end(self, *_: Any, **__: Any) -> None: ...


class NullRun:
    """What `current_run()` returns when nothing records. Every method is a no-op."""

    enabled = False
    finished = False
    run_id = None
    build_id = None
    dir = None

    @contextmanager
    def phase(self, *_: Any, **__: Any) -> Iterator[_NullPhase]:
        yield _NullPhase()

    def phase_begin(self, *_: Any, **__: Any) -> _NullPhase:
        return _NullPhase()

    def current_phase(self) -> None:
        return None

    def set_config(self, *_: Any, **__: Any) -> None: ...
    def set_as_of(self, *_: Any, **__: Any) -> None: ...
    def set_dataset_dirs(self, *_: Any, **__: Any) -> None: ...
    def count(self, *_: Any, **__: Any) -> None: ...
    def set_counters(self, *_: Any, **__: Any) -> None: ...
    def set_breakdown(self, *_: Any, **__: Any) -> None: ...
    def progress(self, *_: Any, **__: Any) -> None: ...
    def http(self, *_: Any, **__: Any) -> None: ...
    def es_server(self, *_: Any, **__: Any) -> None: ...
    def es_op(self, *_: Any, **__: Any) -> None: ...
    def artifact(self, *_: Any, **__: Any) -> None: ...
    def section(self, *_: Any, **__: Any) -> None: ...
    def log(self, *_: Any, **__: Any) -> None: ...
    def finish(self, *_: Any, **__: Any) -> None: ...
    def fail_with_exception(self, *_: Any, **__: Any) -> None: ...


NULL_RUN = NullRun()
AnyRun = Union[RunRecorder, NullRun]

_active: Optional[RunRecorder] = None
_active_lock = threading.Lock()


def current_run() -> AnyRun:
    run = _active
    if run is not None and run.pid == os.getpid() and not run.finished:
        return run
    return NULL_RUN


def _deactivate(run: RunRecorder) -> None:
    global _active
    with _active_lock:
        if _active is run:
            _active = None


def _start(**options: Any) -> Tuple[AnyRun, bool]:
    """(the run, whether this call opened it). A run already open is shared."""
    global _active
    with _active_lock:
        existing = current_run()
        if existing is not NULL_RUN:
            return existing, False
        if not recording_enabled():
            return NULL_RUN, False
        try:
            run = RunRecorder(**options)
        except Exception as exc:  # an unwritable builds dir and the like: run unrecorded
            _stderr(f'not recording this run ({type(exc).__name__}: {exc})')
            return NULL_RUN, False
        _active = run
        atexit.register(run._atexit)
        return run, True


def start_run(*, step: str, dataset: Optional[str] = None, **options: Any) -> AnyRun:
    return _start(step=step, dataset=dataset or env_text('PANGO_DATASET'), **options)[0]


@contextmanager
def record_run(*, step: str, dataset: Optional[str] = None, **options: Any) -> Iterator[AnyRun]:
    """Open this process's run for the block and record how the block ended.

    The dataset defaults to PANGO_DATASET, which all.sh sets per dataset folder.
    SystemExit is read for its code (0 ok, 130 interrupted, anything else failed);
    other exceptions fail the run with their traceback. A run already open in the
    process is reused and left for its owner to finish.
    """
    run, owned = _start(step=step, dataset=dataset or env_text('PANGO_DATASET'), **options)
    if not owned:
        yield run
        return
    try:
        yield run
    except SystemExit as exc:
        status, reason, code = _exit_status(exc.code)
        run.finish(status, reason=reason, exit_code=code)
        raise
    except BaseException as exc:
        run.fail_with_exception(exc)
        raise
    else:
        run.finish('ok', exit_code=0)
