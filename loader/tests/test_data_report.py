"""src/data_report: the data facts a build records about each dataset."""

import json
import os
import sys
from collections import Counter
from pathlib import Path
from unittest.mock import patch

import pytest

import src.data_report as data_report
from src.analysis.analyze_groups import GroupAnalyzer
from src.build_record import record_run


def read(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


@pytest.fixture(scope='module')
def fixture_report():
    """The report over test_data/pango-test: inputs, the articles file and the outputs."""
    from tests.conftest import INPUT_DIR, OUTPUT_DIR
    return data_report.build_report(INPUT_DIR, OUTPUT_DIR, os.path.join(INPUT_DIR, 'clean-articles.json'))


# --- the fixture, against figures computed the obvious way ---------------------------

def test_figures_match_a_plain_reading_of_the_files(fixture_report, sample_annotations,
                                                     clean_annotations_data, clean_genes_data, terms_fp,
                                                     genes_fp):
    c = fixture_report['counters']
    references = {ref for a in sample_annotations for e in a['evidence'] for ref in e['references']}
    known = [a for a in clean_annotations_data if a['term_type'] == 'known']

    assert c['input_annotations'] == len(sample_annotations)
    assert c['input_terms'] == len(read(terms_fp))
    assert c['input_genes'] == len(read(genes_fp))
    assert c['evidence'] == sum(len(a['evidence']) for a in sample_annotations)
    assert c['references'] == len(references)
    assert c['annotations'] == len(clean_annotations_data)
    assert c['annotations_known_term'] == len(known)
    assert c['annotations_unknown_term'] == len(clean_annotations_data) - len(known)
    assert c['go_terms'] == len({a['term']['id'] for a in known})
    assert c['genes_annotated'] == len({a['gene'] for a in clean_annotations_data})
    assert c['genes'] == len(clean_genes_data)
    assert c['gene_terms'] == sum(g['term_count'] for g in clean_genes_data)
    assert c['slim_terms'] == len({s['id'] for g in clean_genes_data for s in g['slim_terms']})
    assert c['genes_with_unknown_terms'] == sum(
        1 for g in clean_genes_data if any(t['id'].startswith('UNKNOWN:') for t in g['terms']))
    assert c['consistency_failed'] == 0


def test_breakdowns_match_a_plain_reading_of_the_files(fixture_report, clean_annotations_data):
    b = fixture_report['breakdowns']
    assert b['annotations_by_aspect'] == dict(Counter(a['aspect'] for a in clean_annotations_data))
    assert b['annotations_by_evidence_type'] == dict(Counter(a['evidence_type'] for a in clean_annotations_data))
    assert b['annotations_by_term_type'] == dict(Counter(a['term_type'] for a in clean_annotations_data))
    assert sum(b['genes_by_terms'].values()) == fixture_report['counters']['genes']
    assert list(b['genes_by_terms']) == ['1', '2-5', '6-10', '11-20', '21-50', '51-100', '101+']


def test_group_counts_agree_with_the_analysis_script(fixture_report, sample_annotations):
    analyzer = GroupAnalyzer(sample_annotations)
    assert fixture_report['breakdowns']['evidence_by_group'] == dict(analyzer.count_all_occurrences())
    assert fixture_report['breakdowns']['annotations_by_group'] == dict(analyzer.count_unique_per_entry())


def test_the_known_taxon_id_type_split_is_noted(fixture_report):
    assert fixture_report['counters']['taxon_id_types_differ'] == 1
    consistency = next(s for s in fixture_report['sections'] if s['section_id'] == 'consistency')
    assert 'taxon_id is a str in the annotations and a int in the genes' in consistency['text']


def test_sections_use_the_generic_shape(fixture_report):
    assert [s['section_id'] for s in fixture_report['sections']] == \
        ['inputs', 'annotations', 'evidence', 'genes', 'consistency']
    for section in fixture_report['sections']:
        for table in section['tables']:
            keys = {column['key'] for column in table['columns']}
            assert all(set(row) <= keys | {'modified_at', 'role', 'path', 'bytes', 'sha256', 'records'}
                       for row in table['rows']), table['id']


# --- a dataset made to have every problem ----------------------------------------

@pytest.fixture
def broken_dataset(tmp_path):
    """Inputs and outputs with one of each problem the report counts."""
    inp, out = tmp_path / 'in', tmp_path / 'out'
    inp.mkdir()
    out.mkdir()

    def write(folder, name, data):
        (folder / name).write_text(json.dumps(data), encoding='utf-8')

    write(inp, 'full_go_annotated.json', [
        {'ID': 'GO:1', 'LABEL': 'one', 'hasOBONamespace': 'biological_process', 'is_goslim': False},
        {'ID': 'GO:2', 'LABEL': 'two', 'hasOBONamespace': 'biological_process', 'is_goslim': True}])
    write(inp, 'human_iba_gene_info.json', [{'gene': 'G1'}, {'gene': 'G2'}, {'gene': 'G2'}])  # G2 twice
    write(inp, 'taxon_lkp.json', [{'taxon_id': '9606'}])
    write(inp, 'go_hierarchy.json', [{'child': 'GO:1', 'parent': 'GO:2'}])
    write(inp, 'human_iba_annotations.json', [
        {'gene': 'G1', 'term': 'GO:1', 'evidence': [
            {'with_gene_id': 'W1', 'references': ['PMID:1', 'GO_REF:0000033'], 'groups': ['MGI,SGD']},
            {'with_gene_id': 'W9', 'references': ['PMID:404'], 'groups': ['']}]},
        {'gene': 'G3', 'term': 'UNKNOWN:0001', 'evidence': []}])           # G3 has no gene info
    write(tmp_path, 'articles.json', [{'pmid': 'PMID:1'}])                  # no PMID:404
    write(out, 'human_iba_annotations_clean.json', [
        {'gene': 'G1', 'gene_symbol': 'S1', 'term': {'id': 'GO:1', 'label': 'one', 'aspect': 'biological process'},
         'term_type': 'known', 'aspect': 'biological process', 'evidence_type': 'direct', 'taxon_id': '9606',
         'evidence': [{'with_gene_id': {'gene': 'W1', 'taxon_label': 'Mus musculus'},
                       'references': [{'pmid': 'PMID:1'}, None]},
                      {'with_gene_id': {'gene': 'W9', 'taxon_label': 'Mus musculus'}, 'references': [None]}]},
        {'gene': 'G3', 'gene_symbol': None, 'term': {'id': 'UNKNOWN:0001'}, 'term_type': 'unknown',
         'aspect': 'molecular function', 'evidence_type': 'n/a', 'taxon_id': '9606', 'evidence': []}])
    write(out, 'human_iba_genes_clean.json', [
        {'gene': 'G1', 'gene_symbol': 'S1', 'gene_name': 'one', 'named_gene': True, 'taxon_id': 9606,
         'terms': [{'id': 'GO:1'}], 'slim_terms': [{'id': 'GO:2', 'label': 'two', 'aspect': 'biological process'}],
         'term_count': 1},
        {'gene': 'G3', 'gene_symbol': None, 'named_gene': False, 'taxon_id': 9606,
         'terms': [{'id': 'UNKNOWN:0001'}], 'slim_terms': [], 'term_count': 1}])
    return inp, out, tmp_path / 'articles.json'


def test_every_problem_is_counted(broken_dataset):
    inp, out, articles = broken_dataset
    report = data_report.build_report(inp, out, articles)
    c = report['counters']

    assert (c['input_genes'], c['input_genes_duplicated']) == (3, 1)
    assert (c['references'], c['references_non_pmid'], c['references_unresolved']) == (3, 1, 1)
    assert (c['with_genes'], c['with_genes_unresolved']) == (2, 2)
    assert c['annotations_gene_unresolved'] == 1 and c['annotations_without_symbol'] == 1
    assert c['references_null'] == 2
    assert (c['genes_named'], c['genes_unnamed'], c['genes_with_unknown_terms']) == (1, 1, 1)
    assert (c['consistency_checks'], c['consistency_failed']) == (5, 3)
    assert report['breakdowns']['evidence_by_group'] == {'MGI': 1, 'SGD': 1, 'NO GROUP': 1}
    assert report['breakdowns']['annotations_by_evidence'] == \
        {'0': 1, '1': 0, '2': 1, '3': 0, '4-5': 0, '6-10': 0, '11+': 0}
    assert report['breakdowns']['with_genes_by_taxon'] == {'Mus musculus': 2}

    tables = {t['id']: t for s in report['sections'] for t in s['tables']}
    assert tables['unresolved_pmids']['rows'] == [{'reference': 'PMID:404'}]
    assert tables['unresolved_with_genes']['rows'] == [{'gene': 'W1'}, {'gene': 'W9'}]
    assert tables['unknown_term_genes']['rows'] == [{'gene': 'G3', 'symbol': None, 'unknown_terms': 'UNKNOWN:0001'}]
    failed = [row['check'] for row in tables['checks']['rows'] if not row['ok']]
    assert failed == ['Gene ids are unique in the gene info', 'Every annotated gene is in the gene info',
                      'Every with-gene is in the gene info']


def test_without_the_articles_file_pmids_are_not_judged(broken_dataset):
    inp, out, _ = broken_dataset
    counters = data_report.build_report(inp, out)['counters']
    assert 'references_unresolved' not in counters and 'input_articles' not in counters
    assert counters['references'] == 3


def test_zero_counts_are_written_not_left_out(broken_dataset):
    inp, out, articles = broken_dataset
    counters = data_report.build_report(inp, out, articles)['counters']
    assert set(data_report.REPORT_COUNTERS) <= set(counters)


# --- as a recorded step ----------------------------------------------------------

def run_cli(*args):
    with patch.object(sys, 'argv', ['data_report.py', *map(str, args)]):
        arguments = data_report.parse_arguments()
        with record_run(step='report', dataset=arguments.dataset or Path(arguments.input_dir).name,
                        build_script='backfill' if arguments.backfill else 'adhoc'):
            data_report.main(arguments)


def test_the_step_records_counters_breakdowns_and_sections(recording, input_dir, output_dir, articles_fp,
                                                           assert_valid_record, capsys):
    run_cli('-i', input_dir, '-o', output_dir, '-art', articles_fp)

    [path] = recording.glob('*/runs/*/run.json')
    record = read(path)
    assert_valid_record(record, 'run')
    assert record['step'] == 'report' and record['dataset'] == 'pango-test'
    assert record['counters']['annotations'] == 22 and record['counters']['genes'] == 5
    assert set(record['breakdowns']) >= {'annotations_by_aspect', 'genes_by_terms', 'with_genes_by_taxon'}
    assert [s['id'] for s in record['sections']] == ['inputs', 'annotations', 'evidence', 'genes', 'consistency']
    assert [p['name'] for p in record['phases']] == ['inputs', 'evidence', 'annotations', 'genes']
    assert 'Report for pango-test: 22 annotations, 5 genes' in capsys.readouterr().out


def test_a_backfill_is_a_build_dated_by_its_outputs(recording, input_dir, output_dir, assert_valid_record):
    run_cli('-i', input_dir, '-o', output_dir, '--backfill')

    [path] = recording.glob('*/build.json')
    build = read(path)
    assert_valid_record(build, 'build')
    assert build['script'] == 'backfill' and build['status'] == 'ok'
    assert build['as_of'] == data_report.outputs_modified_at(output_dir)
    assert build['datasets'][0]['id'] == 'pango-test'
    assert build['datasets'][0]['output_dir'] == str(output_dir)
