import json
import pytest
import pandas as pd
from unittest.mock import patch

from src.clean_annotations import (
    parse_arguments, spread_terms, get_aspect, get_evidence, term_type,
    get_terms_map, get_articles_map, get_taxon_map, get_genes_map,
    count_evidence, get_groups, get_annos, UNKNOWN_TERMS
)


# --- term_type ---

def test_term_type_known():
    assert term_type({"id": "GO:0006955"}) == "known"


def test_term_type_unknown():
    assert term_type({"id": "UNKNOWN:0001"}) == "unknown"
    assert term_type({"id": "UNKNOWN:0002"}) == "unknown"
    assert term_type({"id": "UNKNOWN:0003"}) == "unknown"


# --- get_terms_map ---

def test_get_terms_map(tmp_path):
    data = [
        {"ID": "GO:0006955", "LABEL": "immune response", "hasOBONamespace": "biological_process", "is_goslim": False},
        {"ID": "GO:0002376", "LABEL": "immune system process", "hasOBONamespace": "biological_process", "is_goslim": True},
    ]
    fp = str(tmp_path / 'terms.json')
    with open(fp, 'w') as f:
        json.dump(data, f)

    df = get_terms_map(fp)
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 2
    assert df.index.name == 'ID'
    assert df.loc['GO:0006955', 'id'] == 'GO:0006955'
    assert df.loc['GO:0006955', 'label'] == 'immune response'
    assert df.loc['GO:0006955', 'aspect'] == 'biological process'


# --- get_articles_map ---

def test_get_articles_map(tmp_path):
    data = [{"pmid": "PMID:15240696", "title": "Two human ULBP/RAET1 molecules", "date": 1089849600000, "authors": ["Bacon L"]}]
    fp = str(tmp_path / 'articles.json')
    with open(fp, 'w') as f:
        json.dump(data, f)

    df = get_articles_map(fp)
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 1
    assert df.index.name == 'pmid'
    assert df.loc['PMID:15240696', 'title'] == 'Two human ULBP/RAET1 molecules'


# --- get_taxon_map ---

def test_get_taxon_map(tmp_path):
    data = [{"taxon_id": "9606", "taxon_label": "Homo sapiens", "taxon_abbr": "Hsa"}]
    fp = str(tmp_path / 'taxon.json')
    with open(fp, 'w') as f:
        json.dump(data, f)

    df = get_taxon_map(fp)
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 1
    assert 'taxon_id' in df.columns
    assert 'taxon_label' in df.columns


# --- get_genes_map ---

def test_get_genes_map(tmp_path):
    genes = [{"gene": "UniProtKB:Q8TD07", "gene_symbol": "RAET1E", "gene_name": "Test gene", "taxon_id": "9606", "panther_family": "PTHR16675", "long_id": "HUMAN|HGNC=16793|UniProtKB=Q8TD07"}]
    taxon = [{"taxon_id": "9606", "taxon_label": "Homo sapiens", "taxon_abbr": "Hsa"}]

    gfp = str(tmp_path / 'genes.json')
    tfp = str(tmp_path / 'taxon.json')
    with open(gfp, 'w') as f:
        json.dump(genes, f)
    with open(tfp, 'w') as f:
        json.dump(taxon, f)

    taxon_df = get_taxon_map(tfp)
    genes_df = get_genes_map(gfp, taxon_df)

    assert isinstance(genes_df, pd.DataFrame)
    assert len(genes_df) == 1
    assert genes_df.loc['UniProtKB:Q8TD07', 'taxon_label'] == 'Homo sapiens'


# --- count_evidence / get_groups ---

def test_count_evidence():
    evidences = [
        {"with_gene_id": "g1", "references": ["r1"], "groups": ["group1"]},
        {"with_gene_id": "g2", "references": ["r2"], "groups": ["group2"]},
    ]
    assert count_evidence(evidences) == 2


def test_get_groups():
    evidences = [
        {"groups": ["UniProt", "GO_Central"]},
        {"groups": ["MGI", "UniProt"]},
        {"groups": ["GO_Central"]},
    ]
    assert set(get_groups(evidences)) == {"UniProt", "GO_Central", "MGI"}


# --- spread_terms / get_aspect ---

def test_spread_terms():
    df = pd.DataFrame({
        'id': ['GO:0001', 'GO:0002'],
        'label': ['term1', 'term2'],
        'aspect': ['biological_process', 'molecular_function'],
    }).set_index('id', drop=False)

    result = spread_terms(df, ['GO:0001', 'GO:0002'])
    assert len(result) == 2
    assert result[0]['id'] == 'GO:0001'
    assert result[1]['id'] == 'GO:0002'


def test_get_aspect():
    df = pd.DataFrame({'aspect': ['biological_process']}, index=['GO:0001'])
    assert get_aspect(df, 'GO:0001') == 'biological_process'
    assert get_aspect(df, 'GO:9999') == 'noGO:9999'


# --- parse_arguments ---

def test_parse_arguments(tmp_path):
    files = {}
    for name in ['annos', 'terms', 'articles', 'taxon', 'genes']:
        fp = str(tmp_path / f'{name}.json')
        with open(fp, 'w') as f:
            f.write('{}')
        files[name] = fp

    with patch('sys.argv', [
        'clean_annotations.py',
        '-a', files['annos'],
        '-t', files['terms'],
        '-art', files['articles'],
        '-tax', files['taxon'],
        '-g', files['genes'],
        '-o', 'output.json',
    ]):
        args = parse_arguments()
        assert args.annos_fp == files['annos']
        assert args.terms_fp == files['terms']
        assert args.articles_fp == files['articles']
        assert args.taxon_fp == files['taxon']
        assert args.genes_fp == files['genes']
        assert args.clean_annos_fp == 'output.json'


# --- Integration with sample test data ---

def test_integration_get_annos(terms_df, genes_df, articles_df, annos_fp):
    result_df = get_annos(annos_fp, terms_df, genes_df, articles_df)
    assert isinstance(result_df, pd.DataFrame)
    assert len(result_df) > 0

    for col in ['gene', 'term', 'slim_terms', 'evidence', 'aspect', 'term_type', 'groups', 'evidence_count']:
        assert col in result_df.columns


def test_integration_mapping_counts(terms_df, articles_df, taxon_df, genes_df):
    assert len(terms_df) > 0
    assert len(articles_df) > 0
    assert len(taxon_df) > 0
    assert len(genes_df) > 0


# --- get_evidence ---

def test_get_evidence():
    articles_df = pd.DataFrame([
        {"pmid": "PMID:111", "title": "Article 1", "date": "2024"},
        {"pmid": "PMID:222", "title": "Article 2", "date": "2024"},
    ]).set_index('pmid', drop=False)

    genes_df = pd.DataFrame([
        {"gene": "UniProtKB:Q1", "gene_symbol": "SYM1"},
        {"gene": "UniProtKB:Q2", "gene_symbol": "SYM2"},
    ]).set_index('gene', drop=False)

    row = {
        "evidence": [
            {"with_gene_id": "UniProtKB:Q1", "references": ["PMID:111", "PMID:222"], "groups": ["UniProt"]},
            {"with_gene_id": "UniProtKB:Q2", "references": ["PMID:111"], "groups": ["MGI"]},
        ]
    }
    result = get_evidence(articles_df, genes_df, row)
    assert len(result) == 2

    assert result[0]['with_gene_id']['gene_symbol'] == 'SYM1'
    assert result[0]['groups'] == ['UniProt']
    assert len(result[0]['references']) == 2
    assert result[0]['references'][0]['title'] == 'Article 1'

    assert result[1]['with_gene_id']['gene_symbol'] == 'SYM2'
    assert result[1]['groups'] == ['MGI']
    assert len(result[1]['references']) == 1


def test_get_evidence_empty():
    articles_df = pd.DataFrame(columns=['pmid', 'title']).set_index('pmid', drop=False)
    genes_df = pd.DataFrame(columns=['gene', 'gene_symbol']).set_index('gene', drop=False)
    row = {"evidence": []}
    assert get_evidence(articles_df, genes_df, row) == []


def test_get_evidence_missing_article():
    articles_df = pd.DataFrame([
        {"pmid": "PMID:111", "title": "Known article"},
    ]).set_index('pmid', drop=False)

    genes_df = pd.DataFrame([
        {"gene": "UniProtKB:Q1", "gene_symbol": "SYM1"},
    ]).set_index('gene', drop=False)

    row = {
        "evidence": [
            {"with_gene_id": "UniProtKB:Q1", "references": ["PMID:111", "PMID:MISSING"], "groups": ["A"]},
        ]
    }
    result = get_evidence(articles_df, genes_df, row)
    assert len(result) == 1
    assert len(result[0]['references']) == 2
    assert result[0]['references'][0]['title'] == 'Known article'
    assert result[0]['references'][1] is None  # missing article returns None via get_pd_row_key


def test_get_evidence_with_real_data(terms_df, genes_df, articles_df, annos_fp):
    annos_df = get_annos(annos_fp, terms_df, genes_df, articles_df)
    for _, row in annos_df.iterrows():
        evidence = row['evidence']
        assert isinstance(evidence, list)
        for item in evidence:
            assert 'with_gene_id' in item
            assert 'groups' in item
            assert 'references' in item


# --- count_evidence edge cases ---

def test_count_evidence_empty():
    assert count_evidence([]) == 0


def test_count_evidence_single():
    assert count_evidence([{"groups": ["A"]}]) == 1


# --- get_groups edge cases ---

def test_get_groups_empty():
    assert get_groups([]) == []


def test_get_groups_single_group():
    assert get_groups([{"groups": ["UniProt"]}]) == ["UniProt"]


# --- spread_terms edge cases ---

def test_spread_terms_empty():
    df = pd.DataFrame({'id': [], 'label': [], 'aspect': []}).set_index('id', drop=False)
    assert spread_terms(df, []) == []


# --- term_type edge cases ---

def test_term_type_all_unknown():
    for term_id in UNKNOWN_TERMS:
        assert term_type({"id": term_id}) == "unknown"


def test_term_type_regular_go_term():
    assert term_type({"id": "GO:0008150"}) == "known"


# --- get_annos output structure ---

def test_get_annos_output_columns(terms_df, genes_df, articles_df, annos_fp):
    result = get_annos(annos_fp, terms_df, genes_df, articles_df)
    expected = [
        'gene', 'term', 'slim_terms', 'evidence', 'evidence_type',
        'gene_symbol', 'gene_name', 'taxon_id', 'taxon_label', 'taxon_abbr',
        'panther_family', 'long_id', 'aspect', 'term_type', 'groups',
        'evidence_count', 'named_gene',
    ]
    for col in expected:
        assert col in result.columns


def test_get_annos_named_gene_flag(terms_df, genes_df, articles_df, annos_fp):
    result = get_annos(annos_fp, terms_df, genes_df, articles_df)
    assert 'named_gene' in result.columns
    assert result['named_gene'].dtype == bool


def test_get_annos_sorted_by_named_gene(terms_df, genes_df, articles_df, annos_fp):
    result = get_annos(annos_fp, terms_df, genes_df, articles_df)
    named = result['named_gene'].tolist()
    # Named genes (True) should come first
    first_false = next((i for i, v in enumerate(named) if not v), len(named))
    assert all(named[:first_false])  # all True before first False
