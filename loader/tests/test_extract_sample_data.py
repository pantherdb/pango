import json
import pytest

import src.extract_sample_data as extract_sample_data
from src import clean_annotations, generate_gene_annotations
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


@pytest.mark.xfail(reason=(
    "BUG: with_gene_ids are not validated, yet clean_annotations.get_evidence raises "
    "KeyError for any with_gene_id missing from the gene info"))
def test_validate_references_missing_with_genes():
    refs = {'genes': {'G1'}, 'terms': {'T1'}, 'articles': set(), 'with_genes': {'G_MISSING'}}
    lookup = {'genes': [{'gene': 'G1'}], 'terms': [{'ID': 'T1'}], 'articles': []}
    assert validate_references(refs, lookup) is False


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


# --- main ---

@pytest.fixture
def run_extract(tmp_path, run_main, annos_fp, terms_fp, articles_fp, taxon_fp, genes_fp):
    """Run extract_sample_data on the test input and return the output folder."""
    def _run(*extra_args, annos=annos_fp):
        out = tmp_path / 'sample'
        run_main(extract_sample_data, '-a', annos, '-t', terms_fp, '-art', articles_fp,
                 '-tax', taxon_fp, '-g', genes_fp, '-o', out, *extra_args)
        return out
    return _run


@pytest.fixture
def first_genes(monkeypatch):
    """Make sampling deterministic: take the first k genes in sorted order."""
    monkeypatch.setattr(extract_sample_data.random, 'sample', lambda population, k: sorted(population)[:k])


def test_main_extracts_self_consistent_subset(run_extract, first_genes, hierarchy_fp):
    out = run_extract('-n', '2', '-hi', hierarchy_fp)

    refs = collect_referenced_entities(load_json_file(out / 'human_iba_annotations.json'))
    genes = load_json_file(out / 'human_iba_gene_info.json')
    terms = {t['ID'] for t in load_json_file(out / 'full_go_annotated.json')}

    assert refs['genes'] == {'UniProtKB:Q5VZP5', 'UniProtKB:Q7Z4T9'}
    assert {g['gene'] for g in genes} == refs['genes'] | refs['with_genes']
    assert terms == refs['terms']
    assert {a['pmid'] for a in load_json_file(out / 'clean-articles.json')} == refs['articles']
    assert {t['taxon_id'] for t in load_json_file(out / 'taxon_lkp.json')} == {g['taxon_id'] for g in genes}
    assert load_json_file(out / 'go_hierarchy.json') == [
        h for h in load_json_file(hierarchy_fp) if h['child'] in terms or h['parent'] in terms
    ]


def test_main_caps_sample_size_at_gene_count(run_extract, sample_annotations):
    out = run_extract('-n', '100')

    assert load_json_file(out / 'human_iba_annotations.json') == sample_annotations


def test_main_without_hierarchy_writes_no_hierarchy_file(run_extract):
    out = run_extract()

    assert not (out / 'go_hierarchy.json').exists()


def test_main_writes_nothing_when_validation_fails(run_extract, write_json, sample_annotations):
    unknown_term = [dict(sample_annotations[0], term='GO:9999999')]

    out = run_extract(annos=write_json('annos.json', unknown_term))

    assert list(out.iterdir()) == []


def test_sample_runs_through_pipeline(tmp_path, run_extract, first_genes, run_main, hierarchy_fp):
    """The point of a sample: the pipeline steps accept it as input."""
    sample = run_extract('-n', '2', '-hi', hierarchy_fp)
    clean_fp, genes_out_fp = tmp_path / 'clean.json', tmp_path / 'genes.json'

    run_main(clean_annotations, '-a', sample / 'human_iba_annotations.json',
             '-t', sample / 'full_go_annotated.json', '-art', sample / 'clean-articles.json',
             '-tax', sample / 'taxon_lkp.json', '-g', sample / 'human_iba_gene_info.json', '-o', clean_fp)
    run_main(generate_gene_annotations, '-a', clean_fp, '-o', genes_out_fp, '-hi', sample / 'go_hierarchy.json')

    genes = load_json_file(genes_out_fp)
    assert sorted(g['gene'] for g in genes) == ['UniProtKB:Q5VZP5', 'UniProtKB:Q7Z4T9']
