"""What each instrumented pipeline step writes into its run record (docs/build-record.md)."""

import json
import sys
from unittest.mock import Mock, patch

import pytest

import src.clean_annotations as clean_annotations
import src.generate_gene_annotations as generate_gene_annotations
import src.get_articles as get_articles
from src.build_record import record_run
from tests.test_get_articles import FakePubMed


def read(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def run_step(module, step, *args, dataset='pango-test'):
    """Run a step's main() as its entry point does: inside record_run."""
    with patch.object(sys, 'argv', [f'{step}.py', *map(str, args)]):
        with record_run(step=step, dataset=dataset):
            module.main()


def the_run(builds):
    [path] = builds.glob('*/runs/*/run.json')
    return read(path)


def test_get_articles_records_the_ncbi_calls(recording, monkeypatch, write_json, assert_valid_record, tmp_path):
    pubmed = FakePubMed()
    pubmed.unknown_ids = {'1003'}
    pubmed.failing_calls = {1}
    monkeypatch.setattr(get_articles.requests, 'get', pubmed.get)
    monkeypatch.setattr(get_articles.time, 'sleep', pubmed.sleeps.append)
    refs = [f'PMID:{1000 + n}' for n in range(150)] + ['GO_REF:0000033']
    annotations = write_json('annotations.json', [
        {'gene': 'G1', 'evidence': [{'references': refs, 'with_gene_id': 'W1', 'groups': ['MGI']}]}])
    out = tmp_path / 'articles.json'

    run_step(get_articles, 'get_articles', '-a', annotations, '-o', out)

    record = the_run(recording)
    assert_valid_record(record, 'run')
    # References come out of a set, so which batch holds the unknown PMID varies.
    answered, failed_batch = pubmed.requests
    unknown = len(set(answered) & pubmed.unknown_ids)
    c = record['counters']
    assert (c['references'], c['references_non_pmid'], c['pmids_requested'], c['pmids_cached']) == (151, 1, 151, 0)
    assert (c['batches'], c['batches_failed'], c['pmids_failed']) == (2, 1, len(failed_batch))
    assert (c['articles_fetched'], c['pmids_unknown']) == (len(answered) - unknown, unknown)
    assert c['articles_out'] == len(answered) - unknown
    http = record['http']
    assert (http['calls'], http['ok'], http['failed'], http['items'], http['unknown']) == (2, 1, 1, 151, unknown)
    assert list(http['errors']) == ['HTTPError']
    [warning] = record['logs']['warning']['entries']
    assert warning['template'] == 'NCBI batch #-# failed and was skipped: # Server Error'
    assert record['artifacts'][0]['role'] == 'articles'
    assert record['artifacts'][0]['records'] == len(answered) - unknown
    assert [p['name'] for p in record['phases']] == ['read_references', 'fetch', 'write']
    assert record['progress']['done'] == record['progress']['total'] == 2


def test_clean_annotations_records_its_inputs_and_output(recording, tmp_path, annos_fp, terms_fp,
                                                         articles_fp, taxon_fp, genes_fp, assert_valid_record):
    out = tmp_path / 'clean.json'
    run_step(clean_annotations, 'clean_annotations', '-a', annos_fp, '-t', terms_fp, '-art', articles_fp,
             '-tax', taxon_fp, '-g', genes_fp, '-o', out)

    record = the_run(recording)
    assert_valid_record(record, 'run')
    assert record['counters'] == {'terms': 28, 'articles': 37, 'taxa': 6, 'genes': 24, 'annotations': 22}
    assert [p['name'] for p in record['phases']] == \
        ['load_terms', 'load_articles', 'load_taxa', 'load_genes', 'join', 'write']
    [artifact] = record['artifacts']
    assert (artifact['role'], artifact['records'], artifact['phase']) == ('clean_annotations', 22, 'write')
    assert artifact['bytes'] == out.stat().st_size


def test_generate_gene_annotations_records_its_output(recording, tmp_path, clean_annos_fp, hierarchy_fp,
                                                      assert_valid_record):
    out = tmp_path / 'genes.json'
    run_step(generate_gene_annotations, 'generate_gene_annotations', '-a', clean_annos_fp, '-o', out,
             '-hi', hierarchy_fp)

    record = the_run(recording)
    assert_valid_record(record, 'run')
    assert record['counters'] == {'hierarchy_terms': 152, 'hierarchy_edges': 156, 'genes': 5}
    assert record['artifacts'][0]['role'] == 'clean_genes' and record['artifacts'][0]['records'] == 5


@pytest.fixture
def index_es(tmp_path_factory):
    """src.index_es, imported from a scratch working directory (it truncates ./logfile.log)."""
    import importlib
    with pytest.MonkeyPatch.context() as mp:
        mp.chdir(tmp_path_factory.mktemp('index_es_cwd'))
        return importlib.import_module('src.index_es')


def test_index_es_records_each_index(recording, monkeypatch, index_es, clean_annos_fp, clean_genes_fp,
                                     assert_valid_record):
    es = Mock(name='es')
    es.info.return_value = {'name': 'node-1', 'cluster_name': 'docker-cluster', 'version': {'number': '8.5.0'}}
    monkeypatch.setattr(index_es, 'es', es)
    monkeypatch.setattr(index_es, 'create_index', lambda index_type, prefix: f'{prefix}-{index_type}')
    monkeypatch.setattr(index_es.helpers, 'bulk', lambda client, actions, **kw: (len(list(actions)), []))

    run_step(index_es, 'index_es', '-a', clean_annos_fp, '-g', clean_genes_fp, '-p', 'pango-test', dataset=None)

    record = the_run(recording)
    assert_valid_record(record, 'run')
    assert (record['status'], record['dataset']) == ('ok', 'pango-test')
    assert record['counters'] == {'docs_indexed': 27, 'bulk_errors': 0}
    assert record['breakdowns']['docs_indexed'] == {'annotations': 22, 'genes': 5}
    assert [(op['op'], op['index']) for op in record['es']['ops']] == [
        ('recreate_index', 'pango-test-annotations'), ('bulk', 'pango-test-annotations'),
        ('recreate_index', 'pango-test-genes'), ('bulk', 'pango-test-genes')]
    assert record['es']['server'] == {'name': 'node-1', 'cluster': 'docker-cluster', 'version': '8.5.0'}
    assert record['progress']['label'] == 'genes'
    assert record['progress']['done'] == record['progress']['total']


def test_index_es_fails_its_run_when_documents_fail(recording, monkeypatch, index_es, clean_annos_fp,
                                                    clean_genes_fp):
    monkeypatch.setattr(index_es, 'create_index', lambda index_type, prefix: f'{prefix}-{index_type}')
    failed = {'index': {'_id': 'G1', 'status': 400, 'error': {'type': 'mapper_parsing_exception',
                                                              'reason': 'bad'}}}
    results = iter([(21, [failed]), (5, [])])
    monkeypatch.setattr(index_es, 'bulk_load', lambda path, index: next(results))

    with pytest.raises(SystemExit):
        run_step(index_es, 'index_es', '-a', clean_annos_fp, '-g', clean_genes_fp, '-p', 'pango-test')

    record = the_run(recording)
    assert record['status'] == 'failed' and record['exit_code'] == 1
    assert record['status_reason'].startswith('1 documents failed to load')
    assert [(p['name'], p['status']) for p in record['phases']] == [('annotations', 'failed'), ('genes', 'ok')]
    assert record['breakdowns']['bulk_errors'] == {'annotations': 1, 'genes': 0}
    assert record['logs']['error']['entries'][0]['message'].endswith(
        'document G1 (status 400): mapper_parsing_exception: bad')
