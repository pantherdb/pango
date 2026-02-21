import json
import pytest
import pandas as pd
from unittest.mock import patch

from src.generate_gene_annotations import (
    parse_arguments, uniquify_term, uniquify_slim_terms,
    group_terms, get_annos, load_parent_lookup,
    COLUMNS_TO_EXTRACT, parent_lookup
)


# --- Fixtures ---

@pytest.fixture(autouse=True)
def _clear_parent_lookup():
    """Reset parent_lookup global before each test."""
    import src.generate_gene_annotations as mod
    mod.parent_lookup = {}
    yield
    mod.parent_lookup = {}


@pytest.fixture
def _load_hierarchy(hierarchy_fp):
    """Load the test hierarchy into the global parent_lookup."""
    load_parent_lookup(hierarchy_fp)


@pytest.fixture
def sample_clean_annos():
    """Two annotations for the same gene (RAET1E) with different terms."""
    return [
        {
            "gene": "UniProtKB:Q8TD07",
            "term": {"id": "GO:0006955", "label": "immune response", "aspect": "biological_process", "is_goslim": False},
            "slim_terms": [{"id": "GO:0002376", "label": "immune system process", "aspect": "biological_process", "is_goslim": True}],
            "evidence": [{"with_gene_id": {"gene": "UniProtKB:Q8TD07"}, "groups": ["UniProt"], "references": [{"pmid": "PMID:15240696"}]}],
            "evidence_type": "direct",
            "gene_symbol": "RAET1E",
            "gene_name": "Retinoic acid early transcript 1E",
            "taxon_id": "9606",
            "taxon_label": "Homo sapiens",
            "taxon_abbr": "Hsa",
            "panther_family": "PTHR16675",
            "long_id": "HUMAN|HGNC=16793|UniProtKB=Q8TD07",
            "coordinates_chr_num": 6.0,
            "coordinates_start": 149889095.0,
            "coordinates_end": 149890932.0,
            "named_gene": True,
        },
        {
            "gene": "UniProtKB:Q8TD07",
            "term": {"id": "GO:0005102", "label": "signaling receptor binding", "aspect": "molecular_function", "is_goslim": True},
            "slim_terms": [{"id": "GO:0005102", "label": "signaling receptor binding", "aspect": "molecular_function", "is_goslim": True}],
            "evidence": [],
            "evidence_type": "homology",
            "gene_symbol": "RAET1E",
            "gene_name": "Retinoic acid early transcript 1E",
            "taxon_id": "9606",
            "taxon_label": "Homo sapiens",
            "taxon_abbr": "Hsa",
            "panther_family": "PTHR16675",
            "long_id": "HUMAN|HGNC=16793|UniProtKB=Q8TD07",
            "coordinates_chr_num": 6.0,
            "coordinates_start": 149889095.0,
            "coordinates_end": 149890932.0,
            "named_gene": True,
        },
    ]


# --- uniquify_term ---

def test_uniquify_term():
    terms = pd.Series([
        {"id": "GO:0001", "label": "term1", "is_goslim": False},
        {"id": "GO:0002", "label": "term2", "is_goslim": True},
    ])
    evidence = pd.Series(["direct", "homology"])

    result = uniquify_term(terms, evidence)
    assert len(result) == 2
    assert result[0]['id'] == 'GO:0001'
    assert result[0]['evidence_type'] == 'direct'
    assert 'is_goslim' not in result[0]
    assert result[1]['id'] == 'GO:0002'
    assert result[1]['evidence_type'] == 'homology'


def test_uniquify_term_with_duplicates():
    terms = pd.Series([
        {"id": "GO:0001", "label": "term1", "is_goslim": False},
        {"id": "GO:0001", "label": "term1", "is_goslim": False},
    ])
    evidence = pd.Series(["direct", "homology"])

    with pytest.raises(ValueError, match="Duplicate term found"):
        uniquify_term(terms, evidence)


# --- uniquify_slim_terms ---

def test_uniquify_slim_terms():
    slim = pd.Series([
        [{"id": "GO:0001", "label": "s1", "is_goslim": True}, {"id": "GO:0002", "label": "s2", "is_goslim": True}],
        [{"id": "GO:0001", "label": "s1", "is_goslim": True}, {"id": "GO:0003", "label": "s3", "is_goslim": True}],
    ])
    evidence = pd.Series(["direct", "homology"])

    result = uniquify_slim_terms(slim, evidence)
    ids = {t['id'] for t in result}
    assert ids == {'GO:0001', 'GO:0002', 'GO:0003'}
    for term in result:
        assert 'is_goslim' not in term


# --- group_terms ---

def test_group_terms():
    data = {
        'gene': ['UniProtKB:Q8TD07', 'UniProtKB:Q8TD07'],
        'term': [
            {"id": "GO:0001", "label": "term1", "is_goslim": False},
            {"id": "GO:0002", "label": "term2", "is_goslim": True},
        ],
        'slim_terms': [
            [{"id": "GO:0101", "label": "slim1", "is_goslim": True}],
            [{"id": "GO:0102", "label": "slim2", "is_goslim": True}],
        ],
        'evidence_type': ['direct', 'homology'],
        'gene_symbol': ['RAET1E', 'RAET1E'],
        'gene_name': ['Gene name', 'Gene name'],
        'taxon_id': ['9606', '9606'],
        'taxon_label': ['Homo sapiens', 'Homo sapiens'],
        'taxon_abbr': ['Hsa', 'Hsa'],
        'panther_family': ['PTHR16675', 'PTHR16675'],
        'long_id': ['HUMAN|HGNC=16793|UniProtKB=Q8TD07'] * 2,
        'coordinates_chr_num': [6.0, 6.0],
        'coordinates_start': [149889095.0, 149889095.0],
        'coordinates_end': [149890932.0, 149890932.0],
        'named_gene': [True, True],
    }
    group_df = pd.DataFrame(data)
    result = group_terms(group_df)

    assert isinstance(result, pd.Series)
    for col in COLUMNS_TO_EXTRACT:
        assert col in result.index
    assert result['gene_symbol'] == 'RAET1E'
    assert result['term_count'] == 2
    assert len(result['terms']) == 2
    assert len(result['slim_terms']) > 0
    assert result['sort_priority'] == 1  # named gene


def test_group_terms_unnamed_gene():
    data = {
        'gene': ['UniProtKB:Q8TD07', 'UniProtKB:Q8TD07'],
        'term': [
            {"id": "GO:0001", "label": "term1", "is_goslim": False},
            {"id": "GO:0002", "label": "term2", "is_goslim": True},
        ],
        'slim_terms': [
            [{"id": "GO:0101", "label": "slim1", "is_goslim": True}],
            [{"id": "GO:0102", "label": "slim2", "is_goslim": True}],
        ],
        'evidence_type': ['direct', 'homology'],
        'gene_symbol': ['RAET1E', 'RAET1E'],
        'gene_name': ['Gene name', 'Gene name'],
        'taxon_id': ['9606', '9606'],
        'taxon_label': ['Homo sapiens', 'Homo sapiens'],
        'taxon_abbr': ['Hsa', 'Hsa'],
        'panther_family': ['PTHR16675', 'PTHR16675'],
        'long_id': ['HUMAN|HGNC=16793|UniProtKB=Q8TD07'] * 2,
        'coordinates_chr_num': [6.0, 6.0],
        'coordinates_start': [149889095.0, 149889095.0],
        'coordinates_end': [149890932.0, 149890932.0],
        'named_gene': [False, False],
    }
    result = group_terms(pd.DataFrame(data))
    assert result['sort_priority'] == 20  # unnamed gene


# --- get_annos ---

def test_get_annos(tmp_path, sample_clean_annos):
    fp = str(tmp_path / 'clean.json')
    with open(fp, 'w') as f:
        json.dump(sample_clean_annos, f)

    result_df = get_annos(fp)
    assert isinstance(result_df, pd.DataFrame)
    assert len(result_df) == 1  # one unique gene
    assert result_df.iloc[0]['gene_symbol'] == 'RAET1E'
    assert result_df.iloc[0]['term_count'] == 2
    assert 'evidence' not in result_df.columns

    expected_cols = COLUMNS_TO_EXTRACT + ['terms', 'slim_terms', 'term_count']
    for col in expected_cols:
        assert col in result_df.columns


def test_get_annos_multiple_genes(tmp_path, sample_clean_annos):
    extra = {
        "gene": "UniProtKB:P56747",
        "term": {"id": "GO:0008150", "label": "biological process", "aspect": "biological_process", "is_goslim": False},
        "slim_terms": [],
        "evidence": [],
        "evidence_type": "unknown",
        "gene_symbol": "CLDN6",
        "gene_name": "Claudin-6",
        "taxon_id": "9606",
        "taxon_label": "Homo sapiens",
        "taxon_abbr": "Hsa",
        "panther_family": "PTHR12002",
        "long_id": "HUMAN|HGNC=2048|UniProtKB=P56747",
        "coordinates_chr_num": 16.0,
        "coordinates_start": 3014713.0,
        "coordinates_end": 3018170.0,
        "named_gene": True,
    }
    data = sample_clean_annos + [extra]
    fp = str(tmp_path / 'clean.json')
    with open(fp, 'w') as f:
        json.dump(data, f)

    result_df = get_annos(fp)
    assert len(result_df) == 2
    assert set(result_df['gene_symbol']) == {'RAET1E', 'CLDN6'}


# --- parse_arguments ---

def test_parse_arguments(tmp_path):
    annos_fp = str(tmp_path / 'annos.json')
    hierarchy_fp = str(tmp_path / 'hierarchy.json')
    for fp in [annos_fp, hierarchy_fp]:
        with open(fp, 'w') as f:
            f.write('[]')

    with patch('sys.argv', [
        'generate_gene_annotations.py',
        '-a', annos_fp,
        '-o', 'gene_annotations.json',
        '-hi', hierarchy_fp,
    ]):
        args = parse_arguments()
        assert args.annos_fp == annos_fp
        assert args.genes_annos_fp == 'gene_annotations.json'
        assert args.hierarchy_fp == hierarchy_fp


# --- load_parent_lookup ---

def test_load_parent_lookup(tmp_path):
    hierarchy = [
        {"child": "GO:0001", "parent": "GO:0100"},
        {"child": "GO:0001", "parent": "GO:0200"},
        {"child": "GO:0002", "parent": "GO:0100"},
    ]
    fp = str(tmp_path / 'hierarchy.json')
    with open(fp, 'w') as f:
        json.dump(hierarchy, f)

    import src.generate_gene_annotations as mod
    load_parent_lookup(fp)

    assert mod.parent_lookup == {
        'GO:0001': ['GO:0100', 'GO:0200'],
        'GO:0002': ['GO:0100'],
    }


def test_load_parent_lookup_empty(tmp_path):
    fp = str(tmp_path / 'hierarchy.json')
    with open(fp, 'w') as f:
        json.dump([], f)

    import src.generate_gene_annotations as mod
    load_parent_lookup(fp)
    assert mod.parent_lookup == {}


def test_load_parent_lookup_replaces_previous(tmp_path):
    import src.generate_gene_annotations as mod
    mod.parent_lookup = {'OLD:001': ['OLD:002']}

    hierarchy = [{"child": "GO:0001", "parent": "GO:0100"}]
    fp = str(tmp_path / 'hierarchy.json')
    with open(fp, 'w') as f:
        json.dump(hierarchy, f)

    load_parent_lookup(fp)
    assert 'OLD:001' not in mod.parent_lookup
    assert mod.parent_lookup == {'GO:0001': ['GO:0100']}


def test_load_parent_lookup_with_real_data(hierarchy_fp):
    import src.generate_gene_annotations as mod
    load_parent_lookup(hierarchy_fp)
    assert len(mod.parent_lookup) > 0
    for child, parents in mod.parent_lookup.items():
        assert child.startswith('GO:')
        assert isinstance(parents, list)
        assert all(p.startswith('GO:') for p in parents)


# --- uniquify_term with parent_ids ---

def test_uniquify_term_with_parent_ids():
    import src.generate_gene_annotations as mod
    mod.parent_lookup = {
        'GO:0001': ['GO:0100', 'GO:0200'],
        'GO:0002': ['GO:0300'],
    }

    terms = pd.Series([
        {"id": "GO:0001", "label": "term1", "is_goslim": False},
        {"id": "GO:0002", "label": "term2", "is_goslim": True},
    ])
    evidence = pd.Series(["direct", "homology"])

    result = uniquify_term(terms, evidence)
    assert result[0]['parent_ids'] == ['GO:0100', 'GO:0200']
    assert result[1]['parent_ids'] == ['GO:0300']


def test_uniquify_term_no_parents_in_lookup():
    terms = pd.Series([
        {"id": "GO:9999", "label": "orphan", "is_goslim": False},
    ])
    evidence = pd.Series(["direct"])

    result = uniquify_term(terms, evidence)
    assert result[0]['parent_ids'] == []


# --- Integration with real test data ---

def test_integration_with_clean_annos(clean_annos_fp, _load_hierarchy):
    with open(clean_annos_fp) as f:
        data = json.load(f)

    assert len(data) > 0
    result_df = get_annos(clean_annos_fp)
    assert isinstance(result_df, pd.DataFrame)
    assert len(result_df) > 0

    expected_cols = COLUMNS_TO_EXTRACT + ['terms', 'slim_terms', 'term_count']
    for col in expected_cols:
        assert col in result_df.columns

    for _, row in result_df.iterrows():
        assert isinstance(row['terms'], list)
        assert isinstance(row['slim_terms'], list)
        assert row['term_count'] > 0
