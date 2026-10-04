"""annotation, annotations, annotationsCount and annotationsExport against Elasticsearch."""
import json

import pytest

from tests.helpers import EVERY_ANNOTATION_FIELD
from tests.integration.oracle import matching_annotations

pytestmark = pytest.mark.integration

SNX7 = "UniProtKB:Q9UNH6"
COUNT = "query($f: AnnotationFilterArgs) { annotationsCount(filterArgs: $f) { total } }"
LIST = ("query($f: AnnotationFilterArgs, $p: PageArgs) "
        "{ annotations(filterArgs: $f, pageArgs: $p) { id gene term { id } } }")
EXPORT = "query($f: AnnotationFilterArgs, $p: PageArgs) { annotationsExport(filterArgs: $f, pageArgs: $p) { data } }"

FILTERS = [
    pytest.param({}, id="none"),
    pytest.param({"termTypeIds": ["known"]}, id="term-type"),
    pytest.param({"termTypeIds": ["known", "unknown"]}, id="term-types-any"),
    pytest.param({"evidenceTypeIds": ["homology"]}, id="evidence-type"),
    pytest.param({"evidenceTypeIds": ["direct", "n/a"]}, id="evidence-types-any"),
    pytest.param({"aspectIds": ["biological process"]}, id="aspect"),
    pytest.param({"slimTermIds": ["GO:0006914"]}, id="slim-term"),
    pytest.param({"slimTermIds": ["GO:0006914", "GO:0005737"]}, id="slim-terms-any"),
    pytest.param({"geneIds": [SNX7]}, id="gene"),
    pytest.param({"termIds": ["GO:0000422", "UNKNOWN:0001"]}, id="terms-any"),
    pytest.param({"geneIds": [SNX7], "aspectIds": ["molecular function"]}, id="gene-and-aspect"),
    pytest.param({"geneIds": [SNX7], "evidenceTypeIds": ["direct"], "termTypeIds": ["known"]}, id="three-filters"),
]


def keys(annotations):
    return sorted((a["gene"], a["term"]["id"]) for a in annotations)


@pytest.mark.parametrize("filters", FILTERS)
def test_count_matches_the_oracle(live, loader_annotations, filters):
    expected = len(matching_annotations(loader_annotations, filters))
    assert expected, "the fixture no longer exercises this filter"
    assert live.data(COUNT, {"f": filters})["annotationsCount"]["total"] == expected


@pytest.mark.parametrize("filters", FILTERS)
def test_list_matches_the_oracle(live, loader_annotations, filters):
    expected = [{"gene": d["gene"], "term": {"id": d["term"]["id"]}} for d in matching_annotations(loader_annotations, filters)]
    annotations = live.data(LIST, {"f": filters, "p": {"size": 100}})["annotations"]
    assert keys(annotations) == keys(expected)


def test_empty_filter_lists_are_ignored(live, loader_annotations):
    filters = {"termIds": [], "geneIds": [], "slimTermIds": [], "aspectIds": []}
    assert live.data(COUNT, {"f": filters})["annotationsCount"]["total"] == len(loader_annotations)


def test_unmatched_filter_returns_nothing(live):
    filters = {"geneIds": ["UniProtKB:NOT-A-GENE"]}
    assert live.data(COUNT, {"f": filters})["annotationsCount"]["total"] == 0
    assert live.data(LIST, {"f": filters})["annotations"] == []


def test_with_gene_and_reference_filters_are_ignored(live, loader_annotations):
    # Known gap: accepted by the schema, never applied (evidence is mapped "enabled": false)
    filters = {"withGeneIds": ["SGD:S000003573"], "referenceIds": ["PMID:19793921"]}
    assert live.data(COUNT, {"f": filters})["annotationsCount"]["total"] == len(loader_annotations)


def test_pages_partition_the_results(live, loader_annotations):
    seen = []
    for page in range(len(loader_annotations)):
        batch = live.data(LIST, {"p": {"page": page, "size": 5}})["annotations"]
        if not batch:
            break
        seen += [a["id"] for a in batch]
    assert len(seen) == len(set(seen)) == len(loader_annotations)


def test_every_document_serialises(live, loader_annotations):
    query = f"query($p: PageArgs) {{ annotations(pageArgs: $p) {{ {EVERY_ANNOTATION_FIELD} }} }}"
    annotations = live.data(query, {"p": {"size": 100}})["annotations"]
    assert len(annotations) == len(loader_annotations)
    dates = [r["date"] for a in annotations for e in a["evidence"] for r in e["references"]]
    assert dates and all(date.isdigit() for date in dates)


def test_fetch_by_id(live):
    (listed,) = live.data(LIST, {"p": {"size": 1}})["annotations"]
    fetched = live.data("query($id: String!) { annotation(id: $id) { id gene term { id } } }", {"id": listed["id"]})
    assert fetched["annotation"] == listed


def test_unknown_id_is_an_error(live):
    (error,) = live.errors('{ annotation(id: "not-an-annotation") { id } }')
    assert error["path"] == ["annotation"]


def test_other_versions_use_other_indexes(live):
    (error,) = live.errors("{ annotationsCount { total } }", headers={"X-API-Version": "pango-1"})
    assert error["message"] == "index_not_found_exception"


class TestExport:

    def test_rows_for_every_matching_annotation(self, live, loader_annotations):
        filters = {"geneIds": [SNX7]}
        rows = json.loads(live.data(EXPORT, {"f": filters})["annotationsExport"]["data"])
        expected = [{"gene": d["gene"], "gene_symbol": d["gene_symbol"],
                     "term_id": d["term"]["id"], "term_label": d["term"]["label"]}
                    for d in matching_annotations(loader_annotations, filters)]
        by_term = lambda row: row["term_id"]
        assert sorted(rows, key=by_term) == sorted(expected, key=by_term)

    def test_page_size_is_ignored(self, live, loader_annotations):
        rows = json.loads(live.data(EXPORT, {"p": {"size": 2}})["annotationsExport"]["data"])
        assert len(rows) == len(loader_annotations)

    @pytest.mark.xfail(strict=True, raises=AssertionError,
                       reason="BUG: page >= 1 asks for from + 10000 rows, beyond index.max_result_window")
    def test_second_page(self, live):
        live.data(EXPORT, {"p": {"page": 1, "size": 5}})
