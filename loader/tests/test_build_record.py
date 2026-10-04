"""The build recorder (src/build_record): files, ids, the run lifecycle and the build CLI."""

import json
import logging
import os
import time
from pathlib import Path

import pytest

import src.build_record.storage as storage
from src.build_record import (
    NULL_RUN,
    begin_build,
    count_json_items,
    current_run,
    end_build,
    file_fingerprint,
    find_runs,
    record_run,
)
from src.build_record.__main__ import main as cli
from src.build_record.ledger import Ledger, message_template
from src.build_record.paths import builds_dir, new_build_id, new_run_id, recording_enabled, slug, utc_now
from src.build_record.provenance import clean_config, redact
from src.build_record.recorder import HttpLedger


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def run_files(builds):
    return sorted(Path(builds).glob('*/runs/*/run.json'))


def only_run(builds):
    files = run_files(builds)
    assert len(files) == 1, files
    return read(files[0])


def events_of(builds):
    [path] = Path(builds).glob('*/runs/*/events.jsonl')
    return [json.loads(line) for line in path.read_text(encoding='utf-8').splitlines()]


def only_build(builds):
    [path] = Path(builds).glob('*/build.json')
    return read(path)


# --- names, paths, files ------------------------------------------------------------

def test_slug_keeps_ids_path_safe():
    assert slug('pango 2/../x') == 'pango-2-..-x'
    assert slug('...') == 'x'
    assert slug('a' * 80, 10) == 'a' * 10


def test_ids_sort_by_start_time():
    first = new_build_id('all', utc_now())
    time.sleep(1.01)
    second = new_build_id('all', utc_now())
    assert sorted([second, first]) == [first, second]
    assert new_run_id('index_es', 'pango-2', utc_now(), 42).split('-')[1:4] == ['index_es', 'pango', '2']


def test_builds_dir_and_switch_follow_the_environment(monkeypatch, tmp_path):
    monkeypatch.setenv('PANGO_BUILDS_DIR', str(tmp_path))
    assert builds_dir() == tmp_path
    for off in ('0', 'false', 'No', 'off'):
        monkeypatch.setenv('PANGO_RECORD', off)
        assert not recording_enabled()
    monkeypatch.setenv('PANGO_RECORD', '1')
    assert recording_enabled()


def test_write_json_atomic_retries_while_a_reader_holds_the_file(monkeypatch, tmp_path):
    real_replace = os.replace
    attempts = []

    def held_twice(src, dst):
        attempts.append(dst)
        if len(attempts) < 3:
            raise PermissionError('in use')
        real_replace(src, dst)

    monkeypatch.setattr(storage.os, 'replace', held_twice)
    monkeypatch.setattr(storage.time, 'sleep', lambda s: None)
    storage.write_json_atomic(tmp_path / 'run.json', {'a': 1})

    assert read(tmp_path / 'run.json') == {'a': 1}
    assert len(attempts) == 3
    assert [p.name for p in tmp_path.iterdir()] == ['run.json']


def test_write_json_atomic_gives_up_and_cleans_up(monkeypatch, tmp_path):
    monkeypatch.setattr(storage.os, 'replace', lambda src, dst: (_ for _ in ()).throw(PermissionError()))
    monkeypatch.setattr(storage.time, 'sleep', lambda s: None)
    with pytest.raises(PermissionError):
        storage.write_json_atomic(tmp_path / 'run.json', {'a': 1})
    assert list(tmp_path.iterdir()) == []


def test_count_json_items_counts_top_level_items_only(write_json):
    assert count_json_items(write_json('a.json', [{'x': [1, {'y': 2}]}, {'x': []}, 3, 'z', [4]])) == 5
    assert count_json_items(write_json('b.json', [])) == 0


def test_file_fingerprint(write_json, tmp_path):
    path = write_json('a.json', [1, 2])
    print_ = file_fingerprint(path, role='x', records=2)
    assert print_['bytes'] == os.path.getsize(path)
    assert len(print_['sha256']) == 64 and print_['records'] == 2 and print_['role'] == 'x'
    assert print_['modified_at'].endswith('Z')
    missing = file_fingerprint(tmp_path / 'nope.json', role='y')
    assert (missing['bytes'], missing['sha256'], missing['modified_at']) == (None, None, None)


def test_message_template_blanks_the_variable_parts():
    assert (message_template("No summary for PMIDs 123, 456 in 'C:\\data\\x.json'")
            == message_template("No summary for PMIDs 789 in 'D:\\y.json'"))
    assert message_template('Batch 0-100 failed: timeout') == 'Batch #-# failed: timeout'


def test_ledger_groups_samples_and_caps_keys():
    ledger = Ledger(max_keys=2, max_samples=2)
    for n in range(3):
        ledger.add(level='WARNING', logger='a', message=f'batch {n} failed', at='t')
    ledger.add(level='ERROR', logger='a', message='other', at='t')
    entry, _ = ledger.add(level='ERROR', logger='a', message='a third kind', at='t')

    assert entry is None
    record = ledger.to_dict()
    [warning] = record['warning']['entries']
    assert (warning['count'], len(warning['samples']), warning['message']) == (3, 2, 'batch 0 failed')
    assert record['error'] == {'total': 2, 'keys': 1, 'overflow': 1, 'entries': record['error']['entries']}


def test_secrets_are_redacted():
    assert redact('http://elastic:s3cret@host:9200') == 'http://elastic:***@host:9200'
    assert clean_config({'password': 'x', 'api_key': 'y', 'url': 'http://u:p@h', 'path': Path('a'),
                         'items': (1, 2)}) == {'password': '***', 'api_key': '***', 'url': 'http://u:***@h',
                                               'path': 'a', 'items': [1, 2]}


def test_http_ledger_summary():
    ledger = HttpLedger()
    for latency in (100, 200, 300, 400):
        ledger.add({'outcome': 'ok', 'items': 100, 'status': 200, 'latency_ms': latency, 'at': 't1'})
    ledger.add({'outcome': 'error', 'items': 100, 'status': 503, 'error_type': 'HTTPError',
                'error': '503 Server Error', 'latency_ms': 50, 'unknown': 0, 'at': 't2'})
    summary = ledger.to_dict()
    assert (summary['calls'], summary['ok'], summary['failed'], summary['items']) == (5, 4, 1, 500)
    assert summary['errors'] == {'HTTPError': {'count': 1, 'statuses': {'503': 1}, 'message': '503 Server Error'}}
    assert summary['latency_ms'] == {'count': 5, 'mean': 210.0, 'p50': 200.0, 'p90': 400.0, 'max': 400.0}
    assert (summary['first_at'], summary['last_at']) == ('t1', 't2')
    assert HttpLedger().to_dict() is None


# --- a run --------------------------------------------------------------------------

def test_a_run_writes_its_record_as_it_goes(recording, assert_valid_record):
    with record_run(step='index_es', dataset='pango-2', config={'token': 'x', 'n': 1}) as run:
        assert current_run() is run
        with run.phase('annotations') as phase:
            phase.count('docs_indexed', 20, by='annotations')
            phase.count('docs_indexed', 5, by='annotations')
            run.progress(50, 200, label='annotations', unit='bytes')
            run.es_op('bulk', index='pango-2-annotations', count=25, errors=0, duration_s=1.23456)
            mid_run = only_run(recording)
        run.count('docs_indexed', 3, by='genes')
        run.artifact(__file__, role='test', records=1)
        run.section('demo', 'Demo', headline={'Docs': 28},
                    tables=[{'id': 't', 'title': 'T', 'columns': [{'key': 'k', 'label': 'K'}], 'rows': [{'k': 1}]}])

    assert mid_run['status'] == 'running' and mid_run['phases'][0]['status'] == 'running'
    record = only_run(recording)
    assert_valid_record(record, 'run')
    assert (record['status'], record['exit_code'], record['dataset']) == ('ok', 0, 'pango-2')
    assert record['title'] == 'index_es · pango-2'
    assert record['config'] == {'token': '***', 'n': 1}
    assert record['counters'] == {'docs_indexed': 28}
    assert record['breakdowns'] == {'docs_indexed': {'annotations': 25, 'genes': 3}}
    assert record['phases'][0]['counters'] == {'docs_indexed': 25}
    assert record['es']['ops'][0]['duration_s'] == 1.235
    assert record['artifacts'][0]['records'] == 1 and record['artifacts'][0]['phase'] is None
    assert record['sections'][0]['tables'][0]['total_rows'] == 1
    assert current_run() is NULL_RUN
    kinds = [event['type'] for event in events_of(recording)]
    assert kinds == ['run.start', 'phase.start', 'progress', 'es', 'phase.end', 'artifact', 'section', 'run.end']
    assert [event['seq'] for event in events_of(recording)] == list(range(1, len(kinds) + 1))


def test_an_exception_fails_the_run_and_its_open_phase(recording, assert_valid_record):
    with pytest.raises(KeyError):
        with record_run(step='clean_annotations') as run:
            with run.phase('join'):
                raise KeyError('UniProtKB:X')

    record = only_run(recording)
    assert_valid_record(record, 'run')
    assert (record['status'], record['exit_code']) == ('failed', 1)
    assert record['status_reason'] == "KeyError: 'UniProtKB:X'"
    assert record['exception']['type'] == 'KeyError' and 'Traceback' in record['exception']['traceback']
    assert record['phases'][0]['status'] == 'failed'


@pytest.mark.parametrize('exit_with, status, reason, code', [
    (SystemExit(0), 'ok', None, 0),
    (SystemExit(None), 'ok', None, 0),
    (SystemExit(2), 'failed', 'Exited with code 2', 2),
    (SystemExit('3 documents failed to load'), 'failed', '3 documents failed to load', 1),
    (SystemExit(130), 'interrupted', 'Interrupted', 130),
    (KeyboardInterrupt(), 'interrupted', 'Interrupted', 130),
])
def test_how_a_run_ended(recording, exit_with, status, reason, code):
    with pytest.raises(type(exit_with)):
        with record_run(step='verify'):
            raise exit_with
    record = only_run(recording)
    assert (record['status'], record['status_reason'], record['exit_code']) == (status, reason, code)


def test_recording_off_means_a_null_run(monkeypatch, tmp_path):
    monkeypatch.setenv('PANGO_BUILDS_DIR', str(tmp_path))
    with record_run(step='verify') as run:
        assert run is NULL_RUN and current_run() is NULL_RUN
        with run.phase('x') as phase:
            phase.count('n')
        run.artifact('x', role='y')
    assert list(tmp_path.iterdir()) == []


def test_an_unwritable_builds_dir_runs_the_step_unrecorded(monkeypatch, tmp_path, capsys):
    blocker = tmp_path / 'a-file'
    blocker.write_text('not a directory')
    monkeypatch.setenv('PANGO_RECORD', '1')
    monkeypatch.setenv('PANGO_BUILDS_DIR', str(blocker))
    ran = []
    with record_run(step='verify') as run:
        ran.append(run)
    assert ran == [NULL_RUN]
    assert 'build_record: not recording this run' in capsys.readouterr().err


def test_the_heartbeat_keeps_updated_at_moving(recording):
    with record_run(step='index_es', heartbeat_s=0.05):
        first = only_run(recording)['updated_at']
        deadline = time.monotonic() + 5
        while only_run(recording)['updated_at'] == first and time.monotonic() < deadline:
            time.sleep(0.05)
        assert only_run(recording)['updated_at'] != first


def test_warnings_logged_anywhere_are_recorded(recording):
    with record_run(step='index_es') as run:
        with run.phase('genes'):
            logging.getLogger('src.index_es').warning('Genes loading had 2 errors')
            logging.getLogger('src.index_es').warning('Genes loading had 7 errors')
            logging.getLogger('src.index_es').info('not recorded')
        logging.getLogger('elsewhere').error('boom', exc_info=ValueError('bad'))
        run.log('warning', 'printed only')

    logs = only_run(recording)['logs']
    assert logs['warning']['total'] == 3
    grouped = logs['warning']['entries'][0]
    assert (grouped['count'], grouped['template'], grouped['samples'][0]['phase']) == \
        (2, 'Genes loading had # errors', 'genes')
    [error] = logs['error']['entries']
    assert error['logger'] == 'elsewhere' and 'ValueError: bad' in error['samples'][0]['exception']
    assert logging.getLogger().handlers == [h for h in logging.getLogger().handlers
                                            if type(h).__name__ != 'RecordingHandler']


def test_progress_events_every_five_percent(recording):
    with record_run(step='index_es') as run:
        run.progress(0, 1000, label='annotations', unit='bytes')
        for done in range(0, 1001, 10):
            run.progress(done)
        run.progress(3, 4, label='genes')
    events = [e for e in events_of(recording) if e['type'] == 'progress']
    annotations = [e['done'] for e in events if e['label'] == 'annotations']
    assert annotations[-1] == 1000 and 19 <= len(annotations) <= 22
    assert only_run(recording)['progress']['label'] == 'genes'


# --- builds ---------------------------------------------------------------------------

def test_a_run_outside_a_build_is_a_build_of_its_own(recording, assert_valid_record):
    with record_run(step='index_es') as run:
        run.set_config({'index_prefix': 'pango-2'}, dataset='pango-2')

    build = only_build(recording)
    assert_valid_record(build, 'build')
    assert (build['script'], build['status'], build['exit_code']) == ('adhoc', 'ok', 0)
    [dataset] = build['datasets']
    assert dataset['id'] == 'pango-2' and dataset['steps'] == ['index_es']
    assert dataset['indexes']['annotations'] == 'pango-2-annotations-index'
    assert only_run(recording)['build_id'] == build['build_id']


def test_a_build_id_without_its_build_json_is_not_joined(recording, monkeypatch):
    monkeypatch.setenv('PANGO_BUILD_ID', 'never-begun')
    with record_run(step='verify'):
        pass
    assert not (recording / 'never-begun').exists()
    assert only_build(recording)['script'] == 'adhoc'


def test_begin_plans_every_dataset_folder(recording, input_dir, articles_fp, assert_valid_record):
    build_id = begin_build(script='all', input_base=os.path.dirname(input_dir), articles=articles_fp,
                           output_dir='out', label='a test build')

    build = read(recording / build_id / 'build.json')
    assert_valid_record(build, 'build')
    assert (build['status'], build['label'], build['script']) == ('running', 'a test build', 'all')
    [dataset] = build['datasets']
    assert dataset['id'] == 'pango-test'
    assert dataset['output_dir'] == os.path.join('out', 'pango-test')
    assert dataset['steps'] == ['get_articles', 'clean_annotations', 'generate_gene_annotations',
                                'report', 'index_es', 'verify']
    assert [i['role'] for i in dataset['inputs']] == ['terms', 'annotations', 'genes', 'taxon', 'hierarchy']
    assert all(len(i['sha256']) == 64 for i in dataset['inputs'])
    assert dataset['indexes'] == {'annotations': 'pango-test-annotations-index',
                                  'genes': 'pango-test-genes-index'}
    assert build['shared_inputs'][0]['role'] == 'articles'
    assert build['config']['es_url'] == 'http://localhost:9200'


def test_runs_join_the_build_their_script_began(recording, monkeypatch, input_dir):
    build_id = begin_build(script='index_only', input_base=os.path.dirname(input_dir))
    monkeypatch.setenv('PANGO_BUILD_ID', build_id)
    monkeypatch.setenv('PANGO_DATASET', 'pango-test')
    with record_run(step='index_es'):
        pass

    assert [r['step'] for r in find_runs(build_id, root=recording)] == ['index_es']
    assert find_runs(build_id, step='verify', root=recording) == []
    assert find_runs(build_id, dataset='pango-test', root=recording)[0]['dataset'] == 'pango-test'
    assert read(recording / build_id / 'build.json')['datasets'][0]['steps'] == ['index_es', 'verify']


@pytest.mark.parametrize('exit_code, status', [(0, 'ok'), (130, 'interrupted'), (143, 'interrupted'), (2, 'failed')])
def test_end_takes_the_status_from_the_exit_code(recording, exit_code, status):
    build_id = begin_build(script='all')
    end_build(build_id, exit_code)
    build = read(recording / build_id / 'build.json')
    assert (build['status'], build['exit_code']) == (status, exit_code)
    assert build['finished_at'] and build['duration_s'] >= 0


def test_a_failed_build_names_the_run_that_failed(recording, monkeypatch):
    build_id = begin_build(script='all')
    monkeypatch.setenv('PANGO_BUILD_ID', build_id)
    with pytest.raises(SystemExit):
        with record_run(step='index_es', dataset='pango-2'):
            raise SystemExit('3 documents failed to load')
    end_build(build_id, 1)
    assert read(recording / build_id / 'build.json')['status_reason'] == \
        'index_es (pango-2): 3 documents failed to load'


def test_begin_does_nothing_when_recording_is_off(monkeypatch, tmp_path):
    monkeypatch.setenv('PANGO_BUILDS_DIR', str(tmp_path))
    assert begin_build(script='all') is None
    assert list(tmp_path.iterdir()) == []


def test_the_cli_prints_only_the_build_id(recording, capsys, input_dir):
    assert cli(['begin', '--script', 'all', '-i', os.path.dirname(input_dir)]) == 0
    build_id = capsys.readouterr().out.strip()
    assert (recording / build_id / 'build.json').is_file()

    assert cli(['end', '--build-id', build_id, '--exit-code', '0']) == 0
    assert read(recording / build_id / 'build.json')['status'] == 'ok'


@pytest.mark.parametrize('argv', [
    ['begin'],                                       # missing --script
    ['end', '--build-id', 'no-such-build'],          # nothing to close
    ['end'],                                         # recording was off: an empty id
])
def test_the_cli_never_stops_a_build(recording, argv, capsys):
    assert cli(argv) == 0
    assert capsys.readouterr().out == ''
