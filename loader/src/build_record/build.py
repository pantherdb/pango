"""build.json: one build of the loader, as all.sh or run_index_es.sh ran it.

`python -m src.build_record begin` writes it when a script starts and prints the build
id, which the script exports as PANGO_BUILD_ID for its steps; `end` closes it from the
script's exit trap. The build lists what it planned (datasets × steps), so a reader can
tell what never ran after a failure.

A run started outside any build makes a build of its own, script "adhoc" (or
"backfill", for a report over existing outputs), and writes that build.json itself.
"""

import os
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING, List, Optional

from .fingerprint import file_fingerprint
from .paths import (
    SCHEMA_VERSION,
    builds_dir,
    env_text,
    iso,
    new_build_id,
    recording_enabled,
    utc_now,
)
from .provenance import clean_config, git_info, host_info, package_versions, process_info, redact
from .storage import read_json, write_json_atomic

if TYPE_CHECKING:
    from .recorder import RunRecorder

BUILD_FILE = 'build.json'
RELEASE_FILE = 'release.json'

PLANNED_STEPS = {
    'all': ['get_articles', 'clean_annotations', 'generate_gene_annotations', 'report', 'index_es',
            'verify'],
    'index_only': ['index_es', 'verify'],
}

# role -> the file all.sh (or run_index_es.sh) reads from each dataset folder
INPUT_FILES = {
    'all': [
        ('terms', 'full_go_annotated.json'),
        ('annotations', 'human_iba_annotations.json'),
        ('genes', 'human_iba_gene_info.json'),
        ('taxon', 'taxon_lkp.json'),
        ('hierarchy', 'go_hierarchy.json'),
    ],
    'index_only': [
        ('clean_annotations', 'human_iba_annotations_clean.json'),
        ('clean_genes', 'human_iba_genes_clean.json'),
    ],
}

# Steps that write or read Elasticsearch, whose dataset has index names.
ES_STEPS = ('index_es', 'verify')


def build_dir(build_id: str, root: Optional[Path] = None) -> Path:
    return (root or builds_dir()) / build_id


def parse_iso(text: Optional[str]) -> Optional[datetime]:
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace('Z', '+00:00'))
    except ValueError:
        return None


def _load_dotenv() -> None:
    """Read ./.env the way the steps do (load_env.py), without overriding set variables."""
    try:
        from dotenv import load_dotenv
        load_dotenv(Path('.') / '.env')
    except Exception:
        pass


def es_config() -> dict:
    """The Elasticsearch settings the steps will use."""
    _load_dotenv()
    url = os.environ.get('PANGO_ES_URL') or None
    return {
        'es_url': redact(url) if url else None,
        'annotations_index': os.environ.get('PANGO_ANNOTATIONS_INDEX') or None,
        'genes_index': os.environ.get('PANGO_GENES_INDEX') or None,
    }


def index_names(prefix: Optional[str], config: dict) -> dict:
    """The two index names a dataset gets, as src.create_index names them."""
    def name(base: Optional[str]) -> Optional[str]:
        if not base:
            return None
        return f'{prefix}-{base}' if prefix else base
    return {'annotations': name(config.get('annotations_index')),
            'genes': name(config.get('genes_index'))}


def read_release(folder: Path) -> Optional[dict]:
    """The release a dataset folder was copied from, when its release.json says so."""
    path = folder / RELEASE_FILE
    if not path.is_file():
        return None
    try:
        data = read_json(path)
    except (OSError, ValueError):
        return None
    return clean_config(data) if isinstance(data, dict) else None


def discover_datasets(script: str, input_base: Optional[str], output_dir: Optional[str],
                      config: dict) -> List[dict]:
    """The dataset folders the script will process: every directory under the input base."""
    base = Path(input_base) if input_base else None
    if base is None or not base.is_dir():
        return []
    datasets = []
    for folder in sorted(d for d in base.iterdir() if d.is_dir()):
        output = Path(output_dir) / folder.name if script == 'all' and output_dir else folder
        datasets.append({
            'id': folder.name,
            'input_dir': str(folder),
            'output_dir': str(output),
            'release': read_release(folder),
            'inputs': [file_fingerprint(folder / name, role=role)
                       for role, name in INPUT_FILES.get(script, [])],
            'steps': list(PLANNED_STEPS.get(script, [])),
            'indexes': index_names(folder.name, config),
        })
    return datasets


def _base_record(build_id: str, script: str, started: datetime, label: Optional[str]) -> dict:
    return {
        'schema_version': SCHEMA_VERSION,
        'build_id': build_id,
        'label': label or env_text('PANGO_BUILD_LABEL'),
        'script': script,
        'status': 'running',
        'status_reason': None,
        'exit_code': None,
        'started_at': iso(started),
        'updated_at': iso(started),
        'finished_at': None,
        'duration_s': None,
        'as_of': iso(started),
        'host': host_info(),
        'process': process_info(),
        'git': git_info(),
        'packages': package_versions(),
    }


def begin_build(*, script: str, input_base: Optional[str] = None, articles: Optional[str] = None,
                output_dir: Optional[str] = None, label: Optional[str] = None,
                root: Optional[Path] = None) -> Optional[str]:
    """Write a new build.json and return its id; None when recording is off."""
    if not recording_enabled():
        return None
    started = utc_now()
    build_id = new_build_id(script, started)
    directory = build_dir(build_id, root)
    directory.mkdir(parents=True, exist_ok=False)
    config = es_config()
    record = _base_record(build_id, script, started, label)
    record['config'] = clean_config({'input_base': input_base, 'articles': articles,
                                     'output_dir': output_dir, **config})
    record['shared_inputs'] = [file_fingerprint(articles, role='articles')] if articles else []
    record['datasets'] = discover_datasets(script, input_base, output_dir, config)
    write_json_atomic(directory / BUILD_FILE, record)
    return build_id


def find_runs(build_id: str, *, step: Optional[str] = None, dataset: Optional[str] = None,
              root: Optional[Path] = None) -> List[dict]:
    """The readable run.json records of a build, oldest first, optionally filtered."""
    runs_dir = build_dir(build_id, root) / 'runs'
    if not runs_dir.is_dir():
        return []
    runs = []
    for directory in sorted(runs_dir.iterdir()):
        try:
            run = read_json(directory / 'run.json')
        except (OSError, ValueError):
            continue
        if step is not None and run.get('step') != step:
            continue
        if dataset is not None and run.get('dataset') != dataset:
            continue
        runs.append(run)
    return runs


def _failure_reason(build_id: str, exit_code: int, root: Optional[Path]) -> str:
    """Why a build failed, from its last failed run when one says so."""
    failed = [r for r in find_runs(build_id, root=root) if r.get('status') in ('failed', 'interrupted')]
    if failed:
        run = failed[-1]
        where = f"{run.get('step')} ({run['dataset']})" if run.get('dataset') else run.get('step')
        reason = run.get('status_reason') or f"exited with code {run.get('exit_code')}"
        return f'{where}: {reason}'
    return f'Exited with code {exit_code}'


def end_build(build_id: str, exit_code: int, *, root: Optional[Path] = None) -> None:
    """Close a build: its status follows the script's exit code."""
    path = build_dir(build_id, root) / BUILD_FILE
    record = read_json(path)
    finished = utc_now()
    if exit_code == 0:
        status, reason = 'ok', None
    elif exit_code in (130, 143):
        status, reason = 'interrupted', 'Interrupted'
    else:
        status, reason = 'failed', _failure_reason(build_id, exit_code, root)
    started = parse_iso(record.get('started_at'))
    record.update(
        status=status,
        status_reason=reason,
        exit_code=exit_code,
        finished_at=iso(finished),
        updated_at=iso(finished),
        duration_s=round((finished - started).total_seconds(), 3) if started else None,
    )
    write_json_atomic(path, record)


# -- one-run builds ------------------------------------------------------------------

def write_own_build(run: 'RunRecorder') -> None:
    """The build.json of a run that has no build: the run is the whole build."""
    config = es_config()
    record = _base_record(run.build_id, run.build_script, run.started, None)
    record['config'] = clean_config(config)
    record['shared_inputs'] = []
    record['datasets'] = [{
        'id': run.dataset,
        'input_dir': None,
        'output_dir': None,
        'release': None,
        'inputs': [],
        'steps': [run.step],
        'indexes': index_names(run.dataset, config) if run.step in ES_STEPS else None,
    }]
    write_json_atomic(build_dir(run.build_id, run.root) / BUILD_FILE, record)


def finish_own_build(run: 'RunRecorder', snapshot: dict) -> None:
    """Mirror a one-run build's outcome, dataset and date into its build.json."""
    path = build_dir(run.build_id, run.root) / BUILD_FILE
    record = read_json(path)
    record.update(
        status=snapshot['status'],
        status_reason=snapshot['status_reason'],
        exit_code=snapshot['exit_code'],
        finished_at=snapshot['finished_at'],
        updated_at=snapshot['updated_at'],
        duration_s=snapshot['duration_s'],
    )
    if run.as_of:
        record['as_of'] = run.as_of
    if record.get('datasets'):
        dataset = record['datasets'][0]
        dataset['id'] = snapshot['dataset']
        if run.step in ES_STEPS:
            dataset['indexes'] = index_names(snapshot['dataset'], record.get('config') or {})
        if run.dataset_dirs:
            dataset.update(run.dataset_dirs)
    write_json_atomic(path, record)
