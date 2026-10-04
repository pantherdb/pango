import json
import os
import pytest
import requests
from unittest.mock import patch, Mock

import src.get_articles as get_articles
from src.get_articles import (
    get_unique_refs, parse_article, load_existing_articles, get_pubmed_metadata,
)


def read_json(fp):
    with open(fp, encoding='utf-8') as f:
        return json.load(f)


def article(pmid):
    return {"pmid": f"PMID:{pmid}", "title": "Already fetched", "date": "2019", "authors": ["Doe A"]}


class FakePubMed:
    """Stands in for requests.get against the esummary endpoint."""

    def __init__(self):
        self.requests = []          # ids sent in each call
        self.sleeps = []
        self.failing_calls = set()  # call numbers answered with HTTP 500
        self.unknown_ids = set()    # ids PubMed has no summary for

    def get(self, url):
        ids = url.split('id=', 1)[1].split(',')
        call_number = len(self.requests)
        self.requests.append(ids)

        result = {'uids': ids}
        for uid in ids:
            if uid in self.unknown_ids:
                # What esummary actually returns for an unknown or withdrawn PMID.
                result[uid] = {'uid': uid, 'error': 'cannot get document summary'}
            else:
                result[uid] = {'uid': uid, 'title': f'Article {uid}', 'pubdate': '2020 Jan',
                               'authors': [{'name': 'Smith J', 'authtype': 'Author'}]}

        response = Mock()
        response.json.return_value = {'result': result}
        if call_number in self.failing_calls:
            response.raise_for_status.side_effect = requests.HTTPError('500 Server Error')
        return response

    @property
    def requested_ids(self):
        return [uid for batch in self.requests for uid in batch]


@pytest.fixture
def pubmed(monkeypatch):
    fake = FakePubMed()
    monkeypatch.setattr(get_articles.requests, 'get', fake.get)
    monkeypatch.setattr(get_articles.time, 'sleep', fake.sleeps.append)
    return fake


@pytest.fixture
def annotations_citing(write_json):
    """Return a function that writes an annotations file citing the given PMIDs."""
    def _write(pmids):
        return write_json('annotations.json', [{
            "gene": "UniProtKB:Q1", "term": "GO:0000001", "slim_terms": [],
            "evidence": [{"with_gene_id": "UniProtKB:Q2",
                          "references": [f"PMID:{p}" for p in pmids], "groups": ["A"]}],
            "group": "GO_Central", "evidence_type": "homology",
        }])
    return _write


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


# --- get_pubmed_metadata ---

def test_get_pubmed_metadata_fetches_only_new_pmids(tmp_path, pubmed, annotations_citing, write_json):
    existing_fp = write_json('existing.json', [article(1)])
    out_fp = str(tmp_path / 'articles.json')

    get_pubmed_metadata(annotations_citing([1, 2, 3]), out_fp, existing_fp)

    assert sorted(pubmed.requested_ids) == ['2', '3']
    result = read_json(out_fp)
    assert result[0] == article(1)  # existing articles are kept unchanged
    assert {a['pmid']: a for a in result}['PMID:2'] == {
        'pmid': 'PMID:2', 'title': 'Article 2', 'date': '2020 Jan', 'authors': ['Smith J'],
    }
    assert sorted(a['pmid'] for a in result) == ['PMID:1', 'PMID:2', 'PMID:3']


def test_get_pubmed_metadata_requests_batches_of_100(tmp_path, pubmed, annotations_citing):
    out_fp = str(tmp_path / 'articles.json')

    get_pubmed_metadata(annotations_citing(range(1, 251)), out_fp, None)

    assert [len(batch) for batch in pubmed.requests] == [100, 100, 50]
    assert sorted(map(int, pubmed.requested_ids)) == list(range(1, 251))
    assert pubmed.sleeps == [2, 2, 2]  # NCBI rate limit: pause before every request
    assert len(read_json(out_fp)) == 250


def test_get_pubmed_metadata_skips_requests_when_nothing_is_new(pubmed, annotations_citing, write_json):
    existing = [article(1), article(2)]
    out_fp = write_json('articles.json', existing)

    get_pubmed_metadata(annotations_citing([1, 2]), out_fp, out_fp)

    assert pubmed.requests == []
    assert read_json(out_fp) == existing


def test_get_pubmed_metadata_skips_failed_batch_and_refetches_it_next_run(tmp_path, pubmed, annotations_citing):
    annos_fp = annotations_citing(range(1, 151))
    out_fp = str(tmp_path / 'articles.json')
    pubmed.failing_calls = {0}

    get_pubmed_metadata(annos_fp, out_fp, out_fp)

    failed = set(pubmed.requests[0])
    saved = {a['pmid'] for a in read_json(out_fp)}
    assert len(saved) == 50
    assert saved.isdisjoint(f'PMID:{uid}' for uid in failed)

    # all.sh passes the output back in as -e, so a rerun fetches only what is missing.
    pubmed.requests.clear()
    pubmed.failing_calls = set()
    get_pubmed_metadata(annos_fp, out_fp, out_fp)

    assert set(pubmed.requested_ids) == failed
    assert len(read_json(out_fp)) == 150


def test_get_pubmed_metadata_creates_output_directory(tmp_path, pubmed, annotations_citing):
    out_fp = str(tmp_path / 'nested' / 'dir' / 'articles.json')

    get_pubmed_metadata(annotations_citing([1]), out_fp, None)

    assert [a['pmid'] for a in read_json(out_fp)] == ['PMID:1']


def test_get_pubmed_metadata_leaves_no_temp_file(tmp_path, pubmed, annotations_citing):
    get_pubmed_metadata(annotations_citing([1]), str(tmp_path / 'articles.json'), None)

    assert sorted(os.listdir(tmp_path)) == ['annotations.json', 'articles.json']


def test_get_pubmed_metadata_keeps_previous_output_when_write_fails(
        pubmed, annotations_citing, write_json, monkeypatch):
    previous = [article(1)]
    out_fp = write_json('articles.json', previous)

    def failing_write(data, fp):
        with open(fp, 'w', encoding='utf-8') as f:
            f.write('[{"pmid": "PMID:1"')  # interrupted mid-write
        raise OSError('disk full')

    monkeypatch.setattr(get_articles, 'write_to_json', failing_write)

    with pytest.raises(OSError, match='disk full'):
        get_pubmed_metadata(annotations_citing([1, 2]), out_fp, out_fp)

    assert read_json(out_fp) == previous
    assert not os.path.exists(out_fp + '.tmp')


def test_get_pubmed_metadata_accepts_bare_output_filename(tmp_path, monkeypatch, pubmed, annotations_citing):
    annos_fp = annotations_citing([1])
    monkeypatch.chdir(tmp_path)

    get_pubmed_metadata(annos_fp, 'articles.json', None)

    assert [a['pmid'] for a in read_json(tmp_path / 'articles.json')] == ['PMID:1']


def test_get_pubmed_metadata_skips_pmids_without_summary(tmp_path, pubmed, annotations_citing, capsys):
    pubmed.unknown_ids = {'99999999'}
    annos_fp = annotations_citing([1, 99999999, 3])
    out_fp = str(tmp_path / 'articles.json')

    get_pubmed_metadata(annos_fp, out_fp, out_fp)

    # The rest of the batch is kept. The unknown PMID gets no stub article (the API's
    # Reference type needs title, authors and date), so its reference stays null.
    assert sorted(a['pmid'] for a in read_json(out_fp)) == ['PMID:1', 'PMID:3']
    assert '99999999' in capsys.readouterr().out

    # Nothing was cached for it, so the next run asks PubMed again.
    pubmed.requests.clear()
    get_pubmed_metadata(annos_fp, out_fp, out_fp)
    assert pubmed.requested_ids == ['99999999']


# --- main ---

@pytest.mark.parametrize('extra_args, expected_existing', [
    ([], 'out.json'),  # without -e the previous output doubles as the cache
    (['-e', 'old.json'], 'old.json'),
])
def test_main_existing_articles_source(monkeypatch, run_main, annos_fp, extra_args, expected_existing):
    fetch = Mock()
    monkeypatch.setattr(get_articles, 'get_pubmed_metadata', fetch)

    run_main(get_articles, '-a', annos_fp, '-o', 'out.json', *extra_args)

    fetch.assert_called_once_with(annos_fp, 'out.json', expected_existing)
