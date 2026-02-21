import json
import pytest

from src.extract_sample_data import (
    collect_referenced_entities, validate_references,
    filter_lookup_data, load_json_file, save_json_file,
)


# --- collect_referenced_entities ---

def test_collect_referenced_entities_basic():
    annotations = [
        {
            "gene": "UniProtKB:Q1",
            "term": "GO:0001",
            "slim_terms": ["GO:0002", "GO:0003"],
            "evidence": [
                {"with_gene_id": "UniProtKB:Q2", "references": ["PMID:111", "PMID:222"]},
                {"with_gene_id": "UniProtKB:Q3", "references": ["PMID:333"]},
            ],
        }
    ]
    refs = collect_referenced_entities(annotations)
    assert refs['genes'] == {'UniProtKB:Q1'}
    assert refs['terms'] == {'GO:0001', 'GO:0002', 'GO:0003'}
    assert refs['articles'] == {'PMID:111', 'PMID:222', 'PMID:333'}
    assert refs['with_genes'] == {'UniProtKB:Q2', 'UniProtKB:Q3'}


def test_collect_referenced_entities_multiple_annotations():
    annotations = [
        {"gene": "G1", "term": "T1", "slim_terms": ["T2"], "evidence": [{"with_gene_id": "G3", "references": ["A1"]}]},
        {"gene": "G2", "term": "T3", "slim_terms": [], "evidence": [{"with_gene_id": "G4", "references": ["A2"]}]},
    ]
    refs = collect_referenced_entities(annotations)
    assert refs['genes'] == {'G1', 'G2'}
    assert refs['terms'] == {'T1', 'T2', 'T3'}
    assert refs['articles'] == {'A1', 'A2'}
    assert refs['with_genes'] == {'G3', 'G4'}


def test_collect_referenced_entities_empty_evidence():
    annotations = [
        {"gene": "G1", "term": "T1", "slim_terms": [], "evidence": []},
    ]
    refs = collect_referenced_entities(annotations)
    assert refs['genes'] == {'G1'}
    assert refs['terms'] == {'T1'}
    assert refs['articles'] == set()
    assert refs['with_genes'] == set()


def test_collect_referenced_entities_no_slim_terms():
    annotations = [{"gene": "G1", "term": "T1"}]
    refs = collect_referenced_entities(annotations)
    assert refs['terms'] == {'T1'}


def test_collect_referenced_entities_deduplicates():
    annotations = [
        {"gene": "G1", "term": "T1", "slim_terms": ["T1"], "evidence": [{"with_gene_id": "G1", "references": ["A1", "A1"]}]},
    ]
    refs = collect_referenced_entities(annotations)
    assert refs['terms'] == {'T1'}
    assert refs['articles'] == {'A1'}


# --- validate_references ---

def test_validate_references_success():
    refs = {'genes': {'G1'}, 'terms': {'T1'}, 'articles': {'A1'}, 'with_genes': set()}
    lookup = {'genes': [{'gene': 'G1'}], 'terms': [{'ID': 'T1'}], 'articles': [{'pmid': 'A1'}]}
    assert validate_references(refs, lookup) is True


def test_validate_references_missing_genes():
    refs = {'genes': {'G1', 'G_MISSING'}, 'terms': {'T1'}, 'articles': set(), 'with_genes': set()}
    lookup = {'genes': [{'gene': 'G1'}], 'terms': [{'ID': 'T1'}], 'articles': []}
    assert validate_references(refs, lookup) is False


def test_validate_references_missing_terms():
    refs = {'genes': {'G1'}, 'terms': {'T_MISSING'}, 'articles': set(), 'with_genes': set()}
    lookup = {'genes': [{'gene': 'G1'}], 'terms': [], 'articles': []}
    assert validate_references(refs, lookup) is False


def test_validate_references_empty():
    refs = {'genes': set(), 'terms': set(), 'articles': set(), 'with_genes': set()}
    lookup = {'genes': [], 'terms': [], 'articles': []}
    assert validate_references(refs, lookup) is True


# --- filter_lookup_data ---

def test_filter_lookup_data():
    refs = {
        'genes': {'G1', 'G2'},
        'terms': {'T1'},
        'articles': {'A1'},
        'with_genes': {'G3'},
    }
    lookup = {
        'genes': [
            {'gene': 'G1', 'taxon_id': 'TX1'},
            {'gene': 'G2', 'taxon_id': 'TX1'},
            {'gene': 'G3', 'taxon_id': 'TX2'},
            {'gene': 'G4', 'taxon_id': 'TX3'},
        ],
        'terms': [{'ID': 'T1'}, {'ID': 'T2'}],
        'articles': [{'pmid': 'A1'}, {'pmid': 'A2'}],
        'taxons': [{'taxon_id': 'TX1'}, {'taxon_id': 'TX2'}, {'taxon_id': 'TX3'}],
    }
    result = filter_lookup_data(refs, lookup)
    assert len(result['genes']) == 3  # G1, G2, G3 (with_genes included)
    assert len(result['terms']) == 1
    assert len(result['articles']) == 1
    assert len(result['taxons']) == 2  # TX1 (G1,G2), TX2 (G3)


def test_filter_lookup_data_no_with_genes():
    refs = {'genes': {'G1'}, 'terms': set(), 'articles': set(), 'with_genes': set()}
    lookup = {
        'genes': [{'gene': 'G1', 'taxon_id': 'TX1'}, {'gene': 'G2', 'taxon_id': 'TX1'}],
        'terms': [],
        'articles': [],
        'taxons': [{'taxon_id': 'TX1'}],
    }
    result = filter_lookup_data(refs, lookup)
    assert len(result['genes']) == 1
    assert result['genes'][0]['gene'] == 'G1'


# --- load_json_file / save_json_file ---

def test_load_save_round_trip(tmp_path):
    data = [{"key": "value"}, {"num": 42}]
    fp = str(tmp_path / 'test.json')
    save_json_file(data, fp)
    assert load_json_file(fp) == data


def test_save_json_file_indent(tmp_path):
    fp = str(tmp_path / 'test.json')
    save_json_file([{"a": 1}], fp)
    content = open(fp).read()
    assert '\n' in content  # indented output


# --- Integration with real test data ---

def test_collect_and_filter_with_sample_data(sample_annotations):
    refs = collect_referenced_entities(sample_annotations)
    assert len(refs['genes']) > 0
    assert len(refs['terms']) > 0
    assert len(refs['articles']) > 0
