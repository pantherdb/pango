import json
import pytest
from unittest.mock import patch, Mock

from src.get_articles import (
    get_unique_refs, parse_article, load_existing_articles,
)


# --- get_unique_refs ---

def test_get_unique_refs(tmp_path):
    annotations = [
        {"gene": "G1", "term": "T1", "slim_terms": [], "evidence": [
            {"with_gene_id": "G2", "references": ["PMID:111", "PMID:222"], "groups": ["A"]},
            {"with_gene_id": "G3", "references": ["PMID:111", "PMID:333"], "groups": ["B"]},
        ], "group": "X", "evidence_type": "direct"},
        {"gene": "G2", "term": "T2", "slim_terms": [], "evidence": [
            {"with_gene_id": "G1", "references": ["PMID:444"], "groups": ["A"]},
        ], "group": "X", "evidence_type": "homology"},
    ]
    fp = str(tmp_path / 'annos.json')
    with open(fp, 'w') as f:
        json.dump(annotations, f)

    refs = get_unique_refs(fp)
    assert set(refs) == {'PMID:111', 'PMID:222', 'PMID:333', 'PMID:444'}


def test_get_unique_refs_empty_evidence(tmp_path):
    annotations = [
        {"gene": "G1", "term": "T1", "slim_terms": [], "evidence": [], "group": "X", "evidence_type": "n/a"},
    ]
    fp = str(tmp_path / 'annos.json')
    with open(fp, 'w') as f:
        json.dump(annotations, f)

    refs = get_unique_refs(fp)
    assert refs == []


def test_get_unique_refs_with_real_data(annos_fp):
    refs = get_unique_refs(annos_fp)
    assert isinstance(refs, list)
    assert len(refs) > 0
    assert all(r.startswith('PMID:') for r in refs)


# --- parse_article ---

def test_parse_article_full():
    data = {"uid": "12345", "title": "Test title", "pubdate": "2024 Jan", "authors": [{"name": "Smith J"}, {"name": "Doe A"}]}
    result = parse_article(data)
    assert result['pmid'] == 'PMID:12345'
    assert result['title'] == 'Test title'
    assert result['date'] == '2024 Jan'
    assert result['authors'] == ['Smith J', 'Doe A']


def test_parse_article_none_authors():
    data = {"uid": "12345", "title": "Test", "pubdate": "2024", "authors": None}
    result = parse_article(data)
    assert result['pmid'] == 'PMID:12345'
    assert 'authors' not in result


def test_parse_article_missing_optional_fields():
    data = {"uid": "12345", "authors": None}
    result = parse_article(data)
    assert result['pmid'] == 'PMID:12345'
    assert result['title'] == ''
    assert result['date'] is None


# --- load_existing_articles ---

def test_load_existing_articles_valid(tmp_path):
    data = [{"pmid": "PMID:123", "title": "Test"}]
    fp = str(tmp_path / 'existing.json')
    with open(fp, 'w') as f:
        json.dump(data, f)

    result = load_existing_articles(fp)
    assert result == data


def test_load_existing_articles_not_found():
    result = load_existing_articles('/nonexistent/path.json')
    assert result == []


def test_load_existing_articles_invalid_json(tmp_path):
    fp = str(tmp_path / 'bad.json')
    with open(fp, 'w') as f:
        f.write('{ broken json')

    result = load_existing_articles(fp)
    assert result == []


def test_load_existing_articles_none():
    result = load_existing_articles(None)
    assert result == []
