"""src/verify_es: the Elasticsearch checks a build runs after indexing."""

import copy
import json
import sys
from collections import Counter
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest

import src.verify_es as verify_es
from src.build_record import begin_build, record_run

ANNOTATIONS = 'pango-test-annotations-index'
GENES = 'pango-test-genes-index'


def read(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


class FakeIndices:
    def __init__(self, cluster):
        self.cluster = cluster

    def exists(self, index):
        return index in self.cluster.docs

    def refresh(self, index):
        self.cluster.refreshed.append(index)

    def get_mapping(self, index):
        return {index: {'mappings': self.cluster.mappings[index]}}

    def get_settings(self, index):
        return {index: {'settings': {'index': {
            'creation_date': str(int(self.cluster.created[index].timestamp() * 1000)),
            'analysis': {'analyzer': self.cluster.analyzers},
        }}}}


class FakeCluster:
    """What verify_es reads from Elasticsearch, answered from the documents it was given."""

    def __init__(self, annotations, genes, mappings):
        self.docs = {ANNOTATIONS: annotations, GENES: genes}
        self.mappings = mappings
        now = datetime.now(timezone.utc)
        self.created = {ANNOTATIONS: now, GENES: now}
        self.analyzers = {'ngram_analyzer': {'type': 'custom'}}
        self.refreshed = []
        self.indices = FakeIndices(self)

    def info(self):
        return {'name': 'node-1', 'cluster_name': 'docker-cluster', 'version': {'number': '8.5.0'}}

    def _matching(self, index, query):
        docs = self.docs[index]
        if query:
            gene = query['term']['gene.keyword']
            docs = [doc for doc in docs if doc['gene'] == gene]
        return docs

    def count(self, index, query=None):
        return {'count': len(self._matching(index, query))}

    def search(self, index, query, size, source_includes):
        hits = self._matching(index, query)[:size]
        return {'hits': {'hits': [{'_source': {k: doc.get(k) for k in source_includes}} for doc in hits]}}


@pytest.fixture
def cluster(monkeypatch, clean_annotations_data, clean_genes_data):
    """A cluster holding exactly the fixture outputs, mapped as the loader declares."""
    mappings = {ANNOTATIONS: read(verify_es.ES_SETTINGS_DIR / 'annotations_mappings.json'),
                GENES: read(verify_es.ES_SETTINGS_DIR / 'genes_mappings.json')}
    # What dynamic mapping adds on top of the declared fields.
    mappings[ANNOTATIONS]['properties']['evidence_type'] = {'type': 'text'}
    fake = FakeCluster(copy.deepcopy(clean_annotations_data), copy.deepcopy(clean_genes_data), mappings)
    monkeypatch.setattr(verify_es, 'es', fake)
    return fake


def checks_by_name(checks):
    return {(row['index'], row['check']): row for row in checks.rows}


def test_a_faithful_index_passes_every_check(cluster, clean_annos_fp, clean_genes_fp):
    checks, counters = verify_es.verify(clean_annos_fp, clean_genes_fp, 'pango-test')

    assert checks.failed == []
    # 11, not 13: outside a build the two creation times are information, not checks.
    assert counters == {'annotations_expected': 22, 'genes_expected': 5, 'annotations_in_index': 22,
                        'genes_in_index': 5, 'checks': 11, 'checks_failed': 0}
    rows = checks_by_name(checks)
    assert rows[(ANNOTATIONS, 'Fields added by dynamic mapping')]['actual'] == 1
    assert rows[(ANNOTATIONS, 'Fields added by dynamic mapping')]['ok'] is None
    assert rows[(GENES, 'Sampled genes match (5)')]['ok'] is True
    assert cluster.refreshed == [ANNOTATIONS, GENES]


def test_a_missing_document_fails_the_count_and_the_sample(cluster, clean_annos_fp, clean_genes_fp):
    cluster.docs[ANNOTATIONS].pop()
    checks, counters = verify_es.verify(clean_annos_fp, clean_genes_fp, 'pango-test')

    failed = [row['check'] for row in checks.failed]
    assert failed == ['Documents match the output file', "Sampled genes' annotation counts match (5)"]
    assert counters['annotations_in_index'] == 21 and counters['checks_failed'] == 2


def test_a_retyped_or_missing_field_fails_the_mapping_check(cluster, clean_annos_fp, clean_genes_fp):
    properties = cluster.mappings[GENES]['properties']
    properties['gene_symbol']['type'] = 'keyword'
    del properties['name_suggest']
    checks, _ = verify_es.verify(clean_annos_fp, clean_genes_fp, 'pango-test')

    [row] = checks.failed
    assert row['check'] == 'Declared fields are mapped as declared' and row['actual'] == 2
    assert row['detail'] == 'missing name_suggest; gene_symbol: text declared, keyword live'


def test_a_wrong_term_count_fails_the_gene_sample(cluster, clean_annos_fp, clean_genes_fp):
    cluster.docs[GENES][0]['term_count'] += 1
    checks, _ = verify_es.verify(clean_annos_fp, clean_genes_fp, 'pango-test')
    [row] = checks.failed
    assert row['check'] == 'Sampled genes match (5)' and 'term_count' in row['detail']


def test_a_missing_index_stops_its_checks(cluster, clean_annos_fp, clean_genes_fp):
    del cluster.docs[GENES]
    checks, counters = verify_es.verify(clean_annos_fp, clean_genes_fp, 'pango-test')
    assert [row['check'] for row in checks.failed] == ['Index exists']
    assert 'genes_in_index' not in counters


def test_an_unreachable_cluster_is_one_failed_check(monkeypatch, clean_annos_fp, clean_genes_fp):
    class Down:
        def info(self):
            raise ConnectionError('refused')
    monkeypatch.setattr(verify_es, 'es', Down())
    checks, counters = verify_es.verify(clean_annos_fp, clean_genes_fp, 'pango-test')
    assert [(row['check'], row['detail']) for row in checks.failed] == [('Elasticsearch answers', 'refused')]
    assert counters == {}


def test_the_creation_time_is_checked_against_this_builds_index_run(
        cluster, recording, monkeypatch, input_dir, clean_annos_fp, clean_genes_fp):
    build_id = begin_build(script='index_only', input_base=input_dir)
    monkeypatch.setenv('PANGO_BUILD_ID', build_id)
    with record_run(step='index_es', dataset='pango-test'):
        pass
    cluster.created[GENES] = datetime.now(timezone.utc) - timedelta(days=30)   # an older index

    checks, _ = verify_es.verify(clean_annos_fp, clean_genes_fp, 'pango-test')

    rows = checks_by_name(checks)
    assert rows[(ANNOTATIONS, "Created by this build's index_es run")]['ok'] is True
    assert rows[(GENES, "Created by this build's index_es run")]['ok'] is False


def test_outside_a_build_the_creation_time_is_information(cluster, clean_annos_fp, clean_genes_fp):
    checks, _ = verify_es.verify(clean_annos_fp, clean_genes_fp, 'pango-test')
    assert checks_by_name(checks)[(GENES, 'Created at')]['ok'] is None


def test_mapped_fields_flattens_nested_and_multi_fields():
    fields = verify_es.mapped_fields({'gene': {'type': 'text', 'fields': {'keyword': {'type': 'keyword'}}},
                                      'terms': {'type': 'nested', 'properties': {'id': {'type': 'text'}}},
                                      'term': {'properties': {'aspect': {'type': 'text'}}}})
    assert fields == {'gene': 'text', 'gene.keyword': 'keyword', 'terms': 'nested', 'terms.id': 'text',
                      'term': 'object', 'term.aspect': 'text'}


# --- as a recorded step ----------------------------------------------------------

def run_cli(*args):
    with patch.object(sys, 'argv', ['verify_es.py', *map(str, args)]):
        with record_run(step='verify'):
            verify_es.main()


def test_the_step_records_every_check(cluster, recording, clean_annos_fp, clean_genes_fp,
                                      assert_valid_record):
    cluster.docs[ANNOTATIONS].pop()
    run_cli('-a', clean_annos_fp, '-g', clean_genes_fp, '-p', 'pango-test')   # exits 0: not --strict

    [path] = recording.glob('*/runs/*/run.json')
    record = read(path)
    assert_valid_record(record, 'run')
    assert record['status'] == 'ok' and record['dataset'] == 'pango-test'
    assert record['counters']['checks_failed'] == 2
    assert record['breakdowns']['checks_failed'] == {ANNOTATIONS: 2}
    [section] = record['sections']
    assert section['id'] == 'verification' and len(section['tables'][0]['rows']) == 15
    assert record['logs']['error']['total'] == 2
    assert [op['op'] for op in record['es']['ops']][:2] == ['refresh', 'count']
    assert record['es']['server']['version'] == '8.5.0'


def test_strict_exits_non_zero_on_a_failed_check(cluster, recording, clean_annos_fp, clean_genes_fp):
    cluster.docs[GENES].pop()
    with pytest.raises(SystemExit) as exit_info:
        run_cli('-a', clean_annos_fp, '-g', clean_genes_fp, '-p', 'pango-test', '--strict')
    assert exit_info.value.code == '2 Elasticsearch checks failed'
    [path] = recording.glob('*/runs/*/run.json')
    assert read(path)['status_reason'] == '2 Elasticsearch checks failed'
