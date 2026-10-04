import json
import os
import pytest
from unittest.mock import patch

from src.clean_articles import parse_arguments, parse_article, parse_articles, write_to_json


# --- Fixtures ---

@pytest.fixture
def pubmed_batch():
    """Sample PubMed API response with two articles."""
    return {
        "result": {
            "uids": ["8138176", "11884604"],
            "8138176": {
                "uid": "8138176",
                "title": "Mutations in rik1, clr2, clr3 and clr4 genes asymmetrically derepress the silent mating-type loci in fission yeast.",
                "pubdate": "1994 Jan",
                "authors": [
                    {"name": "Ekwall K"},
                    {"name": "Ruusala T"}
                ]
            },
            "11884604": {
                "uid": "11884604",
                "title": "Functional divergence between histone deacetylases in fission yeast by distinct cellular localization and in vivo specificity.",
                "pubdate": "2002 Apr",
                "authors": [
                    {"name": "Bjerling P"},
                    {"name": "Silverstein RA"},
                    {"name": "Thon G"}
                ]
            }
        }
    }


@pytest.fixture
def pubmed_no_authors():
    """PubMed response with None authors."""
    return {
        "result": {
            "uids": ["12345"],
            "12345": {
                "uid": "12345",
                "title": "Test article with no authors",
                "pubdate": "2023 Jan",
                "authors": None
            }
        }
    }


# --- parse_article ---

def test_parse_article(pubmed_batch):
    result = parse_article(pubmed_batch["result"]["8138176"])
    assert result['pmid'] == 'PMID:8138176'
    assert result['title'].startswith('Mutations in rik1')
    assert result['date'] == '1994 Jan'
    assert result['authors'] == ['Ekwall K', 'Ruusala T']


def test_parse_article_no_authors(pubmed_no_authors):
    result = parse_article(pubmed_no_authors["result"]["12345"])
    assert result['pmid'] == 'PMID:12345'
    assert result['date'] == '2023 Jan'
    assert 'authors' not in result


def test_parse_article_empty_authors():
    data = {"uid": "12345", "title": "Test", "pubdate": "2023 Jan", "authors": []}
    result = parse_article(data)
    assert result['pmid'] == 'PMID:12345'
    assert result['authors'] == []


def test_parse_article_requires_title_and_pubdate():
    # Unlike get_articles.parse_article, this parser has no defaults for missing fields.
    with pytest.raises(KeyError):
        parse_article({"uid": "12345", "authors": None})


# --- write_to_json ---

def test_write_to_json(tmp_path):
    data = [{"pmid": "PMID:123", "title": "Test 1"}, {"pmid": "PMID:456", "title": "Test 2"}]
    fp = str(tmp_path / 'out.json')
    write_to_json(data, fp)
    with open(fp, encoding='utf-8') as f:
        assert json.load(f) == data


# --- parse_articles ---

def test_parse_articles(tmp_path, pubmed_batch, pubmed_no_authors):
    in_dir = tmp_path / 'input'
    in_dir.mkdir()
    with open(in_dir / 'articles-1.json', 'w', encoding='utf-8') as f:
        json.dump(pubmed_batch, f)
    with open(in_dir / 'articles-2.json', 'w', encoding='utf-8') as f:
        json.dump(pubmed_no_authors, f)
    (in_dir / 'readme.txt').write_text("not json")

    out_fp = str(tmp_path / 'out.json')
    parse_articles(str(in_dir), out_fp)

    with open(out_fp, encoding='utf-8') as f:
        result = json.load(f)

    assert len(result) == 3
    pmids = {a['pmid'] for a in result}
    assert pmids == {'PMID:8138176', 'PMID:11884604', 'PMID:12345'}
    for article in result:
        assert article['pmid'].startswith('PMID:')


def test_parse_articles_empty_directory(tmp_path):
    in_dir = tmp_path / 'empty'
    in_dir.mkdir()
    out_fp = str(tmp_path / 'out.json')
    parse_articles(str(in_dir), out_fp)
    with open(out_fp, encoding='utf-8') as f:
        assert json.load(f) == []


def test_parse_articles_with_subdirectories(tmp_path, pubmed_batch):
    sub_dir = tmp_path / 'input' / 'subdir'
    sub_dir.mkdir(parents=True)
    with open(sub_dir / 'articles.json', 'w', encoding='utf-8') as f:
        json.dump(pubmed_batch, f)

    out_fp = str(tmp_path / 'out.json')
    parse_articles(str(tmp_path / 'input'), out_fp)

    with open(out_fp, encoding='utf-8') as f:
        result = json.load(f)
    assert len(result) == 2


def test_parse_articles_invalid_json(tmp_path):
    in_dir = tmp_path / 'bad'
    in_dir.mkdir()
    (in_dir / 'invalid.json').write_text('{ invalid json }')
    out_fp = str(tmp_path / 'out.json')

    with pytest.raises(json.JSONDecodeError):
        parse_articles(str(in_dir), out_fp)


# --- parse_arguments ---

def test_parse_arguments(tmp_path):
    in_dir = str(tmp_path / 'input')
    os.makedirs(in_dir)
    with patch('sys.argv', ['clean_articles.py', '-i', in_dir, '-o', 'output.json']):
        args = parse_arguments()
        assert args.in_dir == in_dir
        assert args.out_fp == 'output.json'
