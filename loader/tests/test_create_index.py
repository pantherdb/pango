import json
import os
import pytest
from unittest.mock import MagicMock, call

from src import create_index
from src.create_index import get_index_base_name

ROOT_DIR = os.path.dirname(os.path.dirname(__file__))


def load_es_setting(name):
    with open(os.path.join(ROOT_DIR, 'data', 'es_settings', name), encoding='utf-8') as f:
        return json.load(f)


@pytest.fixture(autouse=True)
def _environment(monkeypatch):
    monkeypatch.setattr(create_index.settings, 'PANGO_ANNOTATIONS_INDEX', 'pango-annotations')
    monkeypatch.setattr(create_index.settings, 'PANGO_GENES_INDEX', 'pango-genes')
    # Settings and mappings are read relative to the working directory (the loader root in all.sh).
    monkeypatch.chdir(ROOT_DIR)


@pytest.fixture
def es(monkeypatch):
    client = MagicMock(name='es')
    monkeypatch.setattr(create_index, 'es', client)
    return client


# --- get_index_base_name ---

@pytest.mark.parametrize('index_type, expected', [
    ('annotations', 'pango-annotations'),
    ('genes', 'pango-genes'),
    ('terms', None),
])
def test_get_index_base_name(index_type, expected):
    assert get_index_base_name(index_type) == expected


# --- create_index ---

@pytest.mark.parametrize('prefix, expected', [
    ('pango-2', 'pango-2-pango-annotations'),
    ('', 'pango-annotations'),  # index_es's default -p
    (None, 'pango-annotations'),
])
def test_create_index_name(es, prefix, expected):
    assert create_index.create_index('annotations', prefix) == expected


def test_create_index_drops_and_recreates_index(es):
    index = create_index.create_index('annotations', 'pango-2')

    assert es.mock_calls == [
        call.options(ignore_status=[400, 404]),
        call.options().indices.delete(index=index),
        call.options(ignore_status=[400, 404]),
        call.options().indices.create(index=index, settings=load_es_setting('settings.json')),
        call.indices.put_mapping(index=index, body=load_es_setting('annotations_mappings.json')),
    ]


@pytest.mark.parametrize('index_type, mapping_file', [
    ('annotations', 'annotations_mappings.json'),
    ('genes', 'genes_mappings.json'),
])
def test_create_index_applies_mapping_for_type(es, index_type, mapping_file):
    index = create_index.create_index(index_type, 'pango-2')

    es.indices.put_mapping.assert_called_once_with(index=index, body=load_es_setting(mapping_file))
