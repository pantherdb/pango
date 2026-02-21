import os
import json
import pytest
import pandas as pd

TESTS_DIR = os.path.dirname(__file__)
ROOT_DIR = os.path.dirname(TESTS_DIR)
TEST_DATA_DIR = os.path.join(ROOT_DIR, 'test_data')
INPUT_DIR = os.path.join(TEST_DATA_DIR, 'input', 'pango-test')
OUTPUT_DIR = os.path.join(TEST_DATA_DIR, 'output', 'pango-test')


# --- Path fixtures ---

@pytest.fixture
def test_data_dir():
    return TEST_DATA_DIR


@pytest.fixture
def input_dir():
    return INPUT_DIR


@pytest.fixture
def output_dir():
    return OUTPUT_DIR


@pytest.fixture
def annos_fp():
    return os.path.join(INPUT_DIR, 'human_iba_annotations.json')


@pytest.fixture
def terms_fp():
    return os.path.join(INPUT_DIR, 'full_go_annotated.json')


@pytest.fixture
def articles_fp():
    return os.path.join(INPUT_DIR, 'clean-articles.json')


@pytest.fixture
def taxon_fp():
    return os.path.join(INPUT_DIR, 'taxon_lkp.json')


@pytest.fixture
def genes_fp():
    return os.path.join(INPUT_DIR, 'human_iba_gene_info.json')


@pytest.fixture
def hierarchy_fp():
    return os.path.join(INPUT_DIR, 'go_hierarchy.json')


@pytest.fixture
def clean_annos_fp():
    return os.path.join(OUTPUT_DIR, 'human_iba_annotations_clean.json')


@pytest.fixture
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
