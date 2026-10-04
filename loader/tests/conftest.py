import os
import sys
import json
import types
from unittest.mock import MagicMock, patch

import pytest
import pandas as pd

TESTS_DIR = os.path.dirname(__file__)
ROOT_DIR = os.path.dirname(TESTS_DIR)
TEST_DATA_DIR = os.path.join(ROOT_DIR, 'test_data')
INPUT_DIR = os.path.join(TEST_DATA_DIR, 'input', 'pango-test')
OUTPUT_DIR = os.path.join(TEST_DATA_DIR, 'output', 'pango-test')


# --- Import-time configuration ---

# src.config.settings fails validation at import unless these are set
# (index_es normally loads them from .env first).
os.environ.update({
    'PANGO_ES_URL': 'http://localhost:9200',
    'PANGO_ANNOTATIONS_INDEX': 'annotations-index',
    'PANGO_GENES_INDEX': 'genes-index',
})

# src.config.es builds a live Elasticsearch client at import time. Stub it so no
# test can reach a real cluster (create_index deletes indices); tests that need
# the client patch the module-level `es` with their own mock.
_es_module = types.ModuleType('src.config.es')
_es_module.es = MagicMock(name='es')
sys.modules['src.config.es'] = _es_module

# Build records are off unless a test asks for the `recording` fixture, and a developer's
# shell can't point a test at their builds dir or into one of their builds.
os.environ['PANGO_RECORD'] = '0'
for _name in ('PANGO_BUILD_ID', 'PANGO_BUILDS_DIR', 'PANGO_DATASET', 'PANGO_BUILD_LABEL'):
    os.environ.pop(_name, None)

SCHEMA_PATH = os.path.join(ROOT_DIR, 'docs', 'build-record.schema.json')


# --- Global state ---

@pytest.fixture(autouse=True)
def _reset_parent_lookup():
    """generate_gene_annotations keeps the GO hierarchy in a module global."""
    import src.generate_gene_annotations as mod
    mod.parent_lookup = {}
    yield
    mod.parent_lookup = {}


# --- Build records ---

@pytest.fixture
def recording(tmp_path, monkeypatch):
    """Turn build records on, into tmp_path/builds; returns that directory."""
    builds = tmp_path / 'builds'
    monkeypatch.setenv('PANGO_RECORD', '1')
    monkeypatch.setenv('PANGO_BUILDS_DIR', str(builds))
    return builds


@pytest.fixture(scope='session')
def assert_valid_record():
    """Return a function that checks a build.json ('build') or run.json ('run') against
    docs/build-record.schema.json."""
    from jsonschema import Draft202012Validator

    with open(SCHEMA_PATH, encoding='utf-8') as f:
        schema = json.load(f)
    validators = {kind: Draft202012Validator({'$ref': f'#/$defs/{kind}', '$defs': schema['$defs']})
                  for kind in ('build', 'run')}

    def _assert(record, kind):
        errors = sorted(validators[kind].iter_errors(record), key=lambda e: list(e.path))
        assert not errors, '\n'.join(f"{'/'.join(map(str, e.path))}: {e.message}" for e in errors[:10])
    return _assert


# --- Helpers ---

@pytest.fixture
def write_json(tmp_path):
    """Return a function that writes data as JSON under tmp_path and returns the path."""
    def _write(name, data):
        fp = tmp_path / name
        fp.parent.mkdir(parents=True, exist_ok=True)
        fp.write_text(json.dumps(data), encoding='utf-8')
        return str(fp)
    return _write


@pytest.fixture(scope='session')
def run_main():
    """Return a function that runs a module's main() with the given CLI arguments."""
    def _run(module, *args):
        with patch.object(sys, 'argv', [f'{module.__name__}.py', *map(str, args)]):
            module.main()
    return _run


# --- Path fixtures ---

@pytest.fixture(scope='session')
def test_data_dir():
    return TEST_DATA_DIR


@pytest.fixture(scope='session')
def input_dir():
    return INPUT_DIR


@pytest.fixture(scope='session')
def output_dir():
    return OUTPUT_DIR


@pytest.fixture(scope='session')
def annos_fp():
    return os.path.join(INPUT_DIR, 'human_iba_annotations.json')


@pytest.fixture(scope='session')
def terms_fp():
    return os.path.join(INPUT_DIR, 'full_go_annotated.json')


@pytest.fixture(scope='session')
def articles_fp():
    return os.path.join(INPUT_DIR, 'clean-articles.json')


@pytest.fixture(scope='session')
def taxon_fp():
    return os.path.join(INPUT_DIR, 'taxon_lkp.json')


@pytest.fixture(scope='session')
def genes_fp():
    return os.path.join(INPUT_DIR, 'human_iba_gene_info.json')


@pytest.fixture(scope='session')
def hierarchy_fp():
    return os.path.join(INPUT_DIR, 'go_hierarchy.json')


@pytest.fixture(scope='session')
def clean_annos_fp():
    return os.path.join(OUTPUT_DIR, 'human_iba_annotations_clean.json')


@pytest.fixture(scope='session')
def clean_genes_fp():
    return os.path.join(OUTPUT_DIR, 'human_iba_genes_clean.json')


# --- DataFrame fixtures ---

@pytest.fixture
def terms_df(terms_fp):
    from src.clean_annotations import get_terms_map
    return get_terms_map(terms_fp)


@pytest.fixture
def articles_df(articles_fp):
    from src.clean_annotations import get_articles_map
    return get_articles_map(articles_fp)


@pytest.fixture
def taxon_df(taxon_fp):
    from src.clean_annotations import get_taxon_map
    return get_taxon_map(taxon_fp)


@pytest.fixture
def genes_df(genes_fp, taxon_df):
    from src.clean_annotations import get_genes_map
    return get_genes_map(genes_fp, taxon_df)


# --- JSON data fixtures ---

@pytest.fixture
def sample_annotations(annos_fp):
    with open(annos_fp, encoding='utf-8') as f:
        return json.load(f)


@pytest.fixture
def clean_annotations_data(clean_annos_fp):
    with open(clean_annos_fp, encoding='utf-8') as f:
        return json.load(f)


@pytest.fixture
def clean_genes_data(clean_genes_fp):
    with open(clean_genes_fp, encoding='utf-8') as f:
        return json.load(f)
