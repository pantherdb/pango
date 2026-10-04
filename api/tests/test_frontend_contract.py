"""The frontend's GraphQL documents (site-react) must validate and run against this API.

Documents are read straight from the TypeScript sources; the variables mirror what each RTK Query
slice sends, and responses are built from the loader's fixture documents.
"""
import re
from collections import Counter

import pytest
from graphql import build_schema, parse, validate

from src.app import schema
from tests.factories import (
    GENES_INDEX,
    count_response,
    filtered_search_response,
    hit,
    search_response,
    slim_label_bucket,
    slim_label_frequency,
    slim_term_bucket,
    slim_term_frequency,
    term_bucket,
    term_frequency,
)
from tests.helpers import FRONTEND_SRC_DIR

SCHEMA = build_schema(schema.as_str())
EXPORTED_DOCUMENT = re.compile(r"export const (\w+) = print\(gql`(.*?)`\)", re.S)
MATCH_ALL = {"bool": {"filter": []}}
# apiService.ts sends this when the page URL has no ?apiVersion
UI_HEADERS = {"X-API-Version": "pango-2"}
# Exported, but no component uses them, and neither matches the API.
STALE = {
    "genesQueryService.GET_ANNOTATIONS_QUERY": "queries annotation fields (term, evidence, ...) on Gene",
    "annotationsQueryService.GET_ANNOTATION_STATS_QUERY": "annotationStats is not exposed by the API",
}


def frontend_sources():
    return sorted(p for p in FRONTEND_SRC_DIR.rglob("*") if p.suffix in (".ts", ".tsx"))


def load_documents():
    if not FRONTEND_SRC_DIR.exists():
        return {}
    return {f"{path.stem}.{name}": body
            for path in frontend_sources()
            for name, body in EXPORTED_DOCUMENT.findall(path.read_text(encoding="utf-8"))}


DOCUMENTS = load_documents()
needs_frontend = pytest.mark.skipif(not FRONTEND_SRC_DIR.exists(), reason="site-react sources not found")


def document(name):
    assert name in DOCUMENTS, f"{name} not found under {FRONTEND_SRC_DIR}"
    return DOCUMENTS[name]


def validation_cases():
    for name in sorted(DOCUMENTS):
        marks = []
        if name in STALE:
            marks.append(pytest.mark.xfail(strict=True, raises=AssertionError,
                                           reason=f"stale frontend document: {STALE[name]}"))
        yield pytest.param(name, id=name, marks=marks)


@needs_frontend
def test_every_gql_document_is_checked():
    # Fails if the frontend writes documents in a form EXPORTED_DOCUMENT doesn't recognise.
    written = sum(path.read_text(encoding="utf-8").count("gql`") for path in frontend_sources())
    assert written == len(DOCUMENTS) > 0


@needs_frontend
@pytest.mark.parametrize("name", list(validation_cases()))
def test_document_validates_against_the_schema(name):
    errors = validate(SCHEMA, parse(DOCUMENTS[name]))
    assert not errors, [e.message for e in errors]


def gene_stats_aggregations(genes):
    """What get_slim_terms_query() returns for these gene documents."""
    gene_counts, slim_terms = Counter(), {}
    for gene in genes:
        for slim in gene["slim_terms"]:
            gene_counts[slim["id"]] += 1
            slim_terms[slim["id"]] = slim
    return slim_term_frequency(*(
        slim_term_bucket(id, slim_terms[id]["label"], slim_terms[id]["aspect"], genes=n)
        for id, n in gene_counts.most_common()))


def term_stats_aggregations(annotations):
    """What get_annotation_terms_query() returns for these annotation documents."""
    genes, first = {}, {}
    for doc in annotations:
        genes.setdefault(doc["term"]["id"], set()).add(doc["gene"])
        first.setdefault(doc["term"]["id"], doc)
    return term_frequency(*(
        term_bucket(id, doc["term"]["label"], doc["term"]["aspect"], genes=len(genes[id]),
                    slim_ids=[s["id"] for s in doc["slim_terms"]])
        for id, doc in first.items()))


@needs_frontend
class TestUIRequests:
    """Each request the UI makes, with the variables its slice sends."""

    def test_genes_page(self, gql, es_mock, loader_genes):
        # genesApiSlice.getGenes, nothing selected
        es_mock.search.side_effect = [
            search_response([hit({}, id=f"g{i}", index=GENES_INDEX) for i in range(len(loader_genes))]),
            search_response([hit(doc, id=f"g{i}", index=GENES_INDEX) for i, doc in enumerate(loader_genes)]),
        ]
        data = gql.data(document("genesQueryService.GET_GENES_QUERY"), {
            "filterArgs": {"geneIds": [], "slimTermIds": [], "termIds": []},
            "pageArgs": {"page": 0, "size": 50},
        }, headers=UI_HEADERS)
        assert [g["gene"] for g in data["genes"]] == [g["gene"] for g in loader_genes]
        first = es_mock.search.await_args_list[0].kwargs
        assert (first["index"], first["query"]) == ("pango-2-pytest-genes", MATCH_ALL)

    def test_genes_count(self, gql, es_mock):
        # genesApiSlice.getGenesCount; undefined filters are dropped from the JSON body
        es_mock.count.return_value = count_response(5)
        data = gql.data(document("genesQueryService.GET_GENES_COUNT_QUERY"), {"filterArgs": {}}, headers=UI_HEADERS)
        assert data == {"genesCount": {"total": 5}}
        assert es_mock.count.await_args.kwargs == {"index": "pango-2-pytest-genes", "query": MATCH_ALL}

    def test_gene_stats(self, gql, es_mock, loader_genes):
        # genesApiSlice.getGenesStats with one slim term selected
        es_mock.search.return_value = search_response(aggregations=gene_stats_aggregations(loader_genes))
        data = gql.data(document("genesQueryService.GET_GENES_STATS_QUERY"),
                        {"filterArgs": {"slimTermIds": ["GO:0006914"]}}, headers=UI_HEADERS)
        buckets = data["geneStats"]["slimTermFrequency"]["buckets"]
        assert buckets
        assert all(b["meta"]["id"] == b["key"] for b in buckets)

    def test_term_stats(self, gql, es_mock, loader_annotations):
        # termsApiSlice.getTermStats as CategoryStats builds it when a category is expanded
        es_mock.search.return_value = search_response(aggregations=term_stats_aggregations(loader_annotations))
        data = gql.data(document("genesQueryService.GET_TERM_STATS_QUERY"), {
            "filterArgs": {"geneIds": [], "slimTermIds": ["GO:0006914"], "termIds": []},
        }, headers=UI_HEADERS)
        buckets = data["termStats"]["termFrequency"]["buckets"]
        assert buckets
        assert all(isinstance(b["meta"]["parentIds"], list) for b in buckets)
        # nothing to resolve in the genes index, so only the annotations are aggregated
        es_mock.search.assert_awaited_once()

    def test_gene_autocomplete(self, gql, es_mock, loader_genes):
        # genesApiSlice.getAutocomplete from GeneSearch
        es_mock.search.return_value = filtered_search_response([hit(loader_genes[0], id="g0", index=GENES_INDEX)])
        data = gql.data(document("genesQueryService.GET_AUTOCOMPLETE_QUERY"), {
            "autocompleteType": "gene",
            "keyword": loader_genes[0]["gene_symbol"][:3],
            "filterArgs": {"geneIds": [], "slimTermIds": [], "termIds": []},
        }, headers=UI_HEADERS)
        assert data["autocomplete"] == [{
            "gene": loader_genes[0]["gene"],
            "geneName": loader_genes[0]["gene_name"],
            "geneSymbol": loader_genes[0]["gene_symbol"],
        }]

    def test_annotations_page(self, gql, es_mock, loader_annotations):
        # annotationsApiSlice.getAnnotations for one gene's detail page
        gene = loader_annotations[0]["gene"]
        docs = [d for d in loader_annotations if d["gene"] == gene]
        es_mock.search.return_value = filtered_search_response([hit(d, id=f"a{i}") for i, d in enumerate(docs)])
        data = gql.data(document("annotationsQueryService.GET_ANNOTATIONS_QUERY"), {
            "filterArgs": {"geneIds": [gene]},
            "pageArgs": {"page": 0, "size": 50},
        }, headers=UI_HEADERS)
        assert [a["term"]["id"] for a in data["annotations"]] == [d["term"]["id"] for d in docs]
        assert es_mock.search.await_args.kwargs["query"] == {"bool": {"filter": [{"terms": {"gene.keyword": [gene]}}]}}

    def test_annotations_count(self, gql, es_mock):
        # annotationsApiSlice.getAnnotationsCount sends no variables
        es_mock.count.return_value = count_response(22)
        data = gql.data(document("annotationsQueryService.GET_ANNOTATIONS_COUNT_QUERY"), headers=UI_HEADERS)
        assert data == {"annotationsCount": {"total": 22}}

    def test_slim_terms_autocomplete(self, gql, es_mock):
        # annotationsApiSlice.getSlimTermsAutocomplete also sends autocompleteType, which the
        # document doesn't declare; GraphQL ignores it
        es_mock.search.return_value = search_response(aggregations=slim_label_frequency(
            slim_label_bucket("GO:0006914", "autophagy", "biological process", 2)))
        data = gql.data(document("annotationsQueryService.GET_SLIM_TERMS_AUTOCOMPLETE_QUERY"),
                        {"autocompleteType": "slim_term", "keyword": "auto"}, headers=UI_HEADERS)
        assert [t["id"] for t in data["slimTermsAutocomplete"]] == ["GO:0006914"]
