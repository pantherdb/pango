import importlib
import json
import pytest
import ijson
from unittest.mock import ANY, Mock, call
from elasticsearch import helpers
from elasticsearch.serializer import JSONSerializer


@pytest.fixture(scope='module')
def index_es(tmp_path_factory):
    """src.index_es, imported from a scratch working directory.

    On import the module loads ./.env and opens ./logfile.log for writing, so
    importing it from the loader root would read a developer's .env and wipe
    their log file.
    """
    with pytest.MonkeyPatch.context() as mp:
        mp.chdir(tmp_path_factory.mktemp('index_es_cwd'))
        return importlib.import_module('src.index_es')


@pytest.fixture
def bulk(index_es, monkeypatch):
    """Stand-in for helpers.bulk that drains the action stream like the real one
    does; the drained documents end up in bulk.documents."""
    bulk = Mock()
    bulk.documents = []

    def drain(client, actions, **kwargs):
        bulk.documents.extend(actions)
        return len(bulk.documents), []

    bulk.side_effect = drain
    monkeypatch.setattr(index_es.helpers, 'bulk', bulk)
    return bulk


def cli_args(clean_annos_fp, clean_genes_fp):
    return '-a', clean_annos_fp, '-g', clean_genes_fp, '-p', 'pango-2'


# --- parse_arguments ---

def test_parse_arguments_defaults_prefix_to_empty(index_es, monkeypatch, clean_annos_fp, clean_genes_fp):
    monkeypatch.setattr('sys.argv', ['index_es.py', '-a', clean_annos_fp, '-g', clean_genes_fp])

    args = index_es.parse_arguments()

    assert (args.annotations_file, args.genes_file, args.index_prefix) == (clean_annos_fp, clean_genes_fp, '')


# --- load_json ---

def test_load_json_streams_array_items(index_es, write_json):
    docs = [{"gene": "G1", "terms": [{"id": "GO:0000001"}]}, {"gene": "G2", "terms": []}]

    assert list(index_es.load_json(write_json('docs.json', docs))) == docs


def test_load_json_raises_on_truncated_file(index_es, tmp_path):
    fp = tmp_path / 'truncated.json'
    fp.write_text('[{"gene": "G1"}, {"gene": ', encoding='utf-8')

    with pytest.raises(ijson.JSONError):
        list(index_es.load_json(str(fp)))


@pytest.mark.parametrize('output_fixture', ['clean_annos_fp', 'clean_genes_fp'])
def test_load_json_documents_serialize_for_bulk(index_es, request, output_fixture):
    """ijson yields floats as Decimal; the client's serializer must write them back as plain numbers."""
    fp = request.getfixturevalue(output_fixture)
    with open(fp, encoding='utf-8') as f:
        expected = json.load(f)

    serializer = JSONSerializer()
    assert [json.loads(serializer.dumps(doc)) for doc in index_es.load_json(fp)] == expected


# --- bulk_load ---

def test_bulk_load_streams_file_into_index(index_es, bulk, monkeypatch, write_json):
    es = Mock(name='es')
    monkeypatch.setattr(index_es, 'es', es)
    docs = [{"gene": "G1"}, {"gene": "G2"}]

    assert index_es.bulk_load(write_json('docs.json', docs), 'pango-2-genes') == (2, [])

    assert bulk.documents == docs
    bulk.assert_called_once_with(es, ANY, index='pango-2-genes', chunk_size=100, request_timeout=200)


def test_bulk_load_returns_errors_from_bulk_index_error(index_es, bulk, write_json):
    errors = [{'index': {'_id': '1', 'status': 400, 'error': {'type': 'mapper_parsing_exception'}}}]
    bulk.side_effect = helpers.BulkIndexError('1 document(s) failed to index.', errors)

    assert index_es.bulk_load(write_json('docs.json', [{}]), 'idx') == (0, errors)


def test_bulk_load_reraises_other_errors(index_es, bulk, write_json):
    bulk.side_effect = ConnectionError('cluster unreachable')

    with pytest.raises(ConnectionError):
        index_es.bulk_load(write_json('docs.json', [{}]), 'idx')


# --- main ---

def test_main_creates_and_loads_both_indices(index_es, monkeypatch, run_main, clean_annos_fp, clean_genes_fp):
    steps = Mock()
    steps.create_index.side_effect = lambda index_type, prefix: f'{prefix}-{index_type}'
    steps.bulk_load.return_value = (1, [])
    monkeypatch.setattr(index_es, 'create_index', steps.create_index)
    monkeypatch.setattr(index_es, 'bulk_load', steps.bulk_load)

    run_main(index_es, *cli_args(clean_annos_fp, clean_genes_fp))

    assert steps.mock_calls == [
        call.create_index('annotations', 'pango-2'),
        call.bulk_load(clean_annos_fp, 'pango-2-annotations'),
        call.create_index('genes', 'pango-2'),
        call.bulk_load(clean_genes_fp, 'pango-2-genes'),
    ]


def test_main_logs_bulk_errors_and_still_loads_genes(
        index_es, monkeypatch, caplog, run_main, clean_annos_fp, clean_genes_fp):
    monkeypatch.setattr(index_es, 'create_index', lambda index_type, prefix: index_type)
    bulk_load = Mock(side_effect=[(8, [{'index': {}}, {'index': {}}]), (5, [])])
    monkeypatch.setattr(index_es, 'bulk_load', bulk_load)

    run_main(index_es, *cli_args(clean_annos_fp, clean_genes_fp))

    assert [c.args[1] for c in bulk_load.call_args_list] == ['annotations', 'genes']
    assert 'Annotations loading had 2 errors' in caplog.text


def test_main_propagates_fatal_errors(index_es, monkeypatch, caplog, run_main, clean_annos_fp, clean_genes_fp):
    monkeypatch.setattr(index_es, 'create_index', Mock(side_effect=ConnectionError('refused')))

    with pytest.raises(ConnectionError):
        run_main(index_es, *cli_args(clean_annos_fp, clean_genes_fp))

    assert 'Fatal error in main execution: refused' in caplog.text
