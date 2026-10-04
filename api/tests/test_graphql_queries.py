"""Every query field end-to-end over HTTP: GraphQL arguments -> Elasticsearch request -> JSON.

The exact DSL for each filter is pinned in test_query_builders.py; here the focus is on argument
names, defaults and coercion, and on how documents serialise.
"""
import json

import pytest
from elasticsearch import NotFoundError

from tests.factories import (
    ANNOTATIONS_INDEX,
    GENES_INDEX,
    annotation_doc,
    api_error,
    count_response,
    evidence,
    evidence_gene,
    filtered_search_response,
    gene_doc,
    get_response,
    hit,
    reference,
    search_response,
    slim_label_bucket,
    slim_label_frequency,
    slim_term_bucket,
    slim_term_frequency,
    term,
    term_bucket,
    term_frequency,
)
from tests.helpers import same_clauses

MATCH_ALL = {"bool": {"filter": []}}

TERM_FIELDS = "id label displayId aspect isGoslim"
ANNOTATION_FIELDS = f"""
    id gene geneSymbol geneName namedGene longId pantherFamily taxonAbbr taxonLabel taxonId
    coordinatesChrNum coordinatesStart coordinatesEnd coordinatesStrand
    termType evidenceType groups evidenceCount
    term {{ {TERM_FIELDS} }}
    slimTerms {{ {TERM_FIELDS} }}
    evidence {{
        withGeneId {{ gene geneSymbol geneName taxonId taxonLabel taxonAbbr }}
        references {{ pmid title authors date }}
    }}
"""
GENE_FIELDS = """
    gene geneSymbol geneName namedGene longId pantherFamily taxonAbbr taxonLabel taxonId
    coordinatesChrNum coordinatesStart coordinatesEnd coordinatesStrand termCount
    terms { id label displayId aspect evidenceType parentIds }
    slimTerms { id label displayId aspect evidenceType }
"""
ANNOTATIONS = "query($f: AnnotationFilterArgs, $p: PageArgs) { annotations(filterArgs: $f, pageArgs: $p) { id } }"
GENES = "query($f: GeneFilterArgs, $p: PageArgs) { genes(filterArgs: $f, pageArgs: $p) { gene geneSymbol } }"

ALL_ANNOTATION_FILTERS = {
    "termIds": ["GO:0000422"],
    "termTypeIds": ["known"],
    "slimTermIds": ["GO:0006914"],
    "geneIds": ["UniProtKB:Q9UNH6"],
    "aspectIds": ["biological process"],
    "evidenceTypeIds": ["homology"],
}
ALL_ANNOTATION_CLAUSES = [
    {"terms": {"term.id.keyword": ["GO:0000422"]}},
    {"terms": {"term_type": ["known"]}},
    {"nested": {"path": "slim_terms", "query": {"terms": {"slim_terms.id.keyword": ["GO:0006914"]}}}},
    {"terms": {"gene.keyword": ["UniProtKB:Q9UNH6"]}},
    {"terms": {"term.aspect.keyword": ["biological process"]}},
    {"terms": {"evidence_type.keyword": ["homology"]}},
]


def respond_with_genes(es_mock, *docs):
    """``genes`` searches twice: a sorted page of ids, then the documents for those ids."""
    es_mock.search.side_effect = [
        search_response([hit({}, id=f"g{i}", index=GENES_INDEX) for i in range(len(docs))]),
        search_response([hit(doc, id=f"g{i}", index=GENES_INDEX) for i, doc in enumerate(docs)]),
    ]


class TestAnnotation:

    def test_full_document(self, gql, es_mock):
        doc = annotation_doc(
            coordinates_chr_num="1",  # float chromosomes are covered in test_loader_contract.py
            evidence=[evidence(with_gene=evidence_gene("SGD:S000003573", "SNX4"),
                               references=[reference("PMID:19793921", date=1257033600000, authors=["Kanki T"])])],
        )
        es_mock.get.return_value = get_response(doc, id="a1")
        data = gql.data(f'{{ annotation(id: "a1") {{ {ANNOTATION_FIELDS} }} }}')
        assert data["annotation"] == {
            "id": "a1",
            "gene": "UniProtKB:Q9UNH6",
            "geneSymbol": "SNX7",
            "geneName": "Sorting nexin-7",
            "namedGene": True,
            "longId": "HUMAN|HGNC=14971|UniProtKB=Q9UNH6",
            "pantherFamily": "PTHR45949",
            "taxonAbbr": "Hsa",
            "taxonLabel": "Homo sapiens",
            "taxonId": "9606",
            "coordinatesChrNum": "1",
            "coordinatesStart": 98662223,  # stored as 98662223.0
            "coordinatesEnd": 98760498,
            "coordinatesStrand": None,  # absent from the document
            "termType": "known",
            "evidenceType": "homology",
            "groups": ["PomBase"],
            "evidenceCount": 1,
            "term": {"id": "GO:0000422", "label": "autophagy of mitochondrion", "displayId": "GO:0000422",
                     "aspect": "biological process", "isGoslim": False},
            "slimTerms": [{"id": "GO:0006914", "label": "autophagy", "displayId": "GO:0006914",
                           "aspect": "biological process", "isGoslim": True}],
            "evidence": [{
                "withGeneId": {"gene": "SGD:S000003573", "geneSymbol": "SNX4", "geneName": "Sorting nexin-4",
                               "taxonId": "284812", "taxonLabel": "Schizosaccharomyces pombe", "taxonAbbr": "Spo"},
                "references": [{
                    "pmid": "PMID:19793921",
                    "title": "Atg20- and Atg24-family proteins promote organelle autophagy in fission yeast.",
                    "authors": ["Kanki T"],
                    "date": "1257033600000",  # epoch milliseconds, serialised as a string
                }],
            }],
        }

    def test_requested_by_id(self, gql, es_mock):
        es_mock.get.return_value = get_response(annotation_doc(), id="a1")
        gql.data('query($id: String!) { annotation(id: $id) { id } }', {"id": "a1"})
        es_mock.get.assert_awaited_once_with(index=ANNOTATIONS_INDEX, id="a1")

    def test_not_found(self, gql, es_mock):
        es_mock.get.side_effect = api_error(
            NotFoundError, 404, {"_index": ANNOTATIONS_INDEX, "_id": "nope", "found": False})
        body = gql.post('{ annotation(id: "nope") { id } }')
        assert body["data"] is None
        assert body["errors"][0]["path"] == ["annotation"]

    @pytest.mark.xfail(strict=True, raises=AssertionError,
                       reason="BUG: Evidence.withGeneId is a Gene, whose non-null terms/slimTerms evidence "
                              "documents never contain ('Gene' object has no attribute 'terms')")
    def test_evidence_genes_resolve_every_gene_field(self, gql, es_mock):
        es_mock.get.return_value = get_response(annotation_doc(), id="a1")
        data = gql.data('{ annotation(id: "a1") { evidence { withGeneId { terms { id } slimTerms { id } termCount } } } }')
        assert data["annotation"]["evidence"][0]["withGeneId"] == {"terms": [], "slimTerms": [], "termCount": None}


class TestAnnotations:

    def test_hits_in_order(self, gql, es_mock):
        es_mock.search.return_value = filtered_search_response([
            hit(annotation_doc(term=term("GO:0000422")), id="a1"),
            hit(annotation_doc(term=term("UNKNOWN:0001", "Unknown molecular function")), id="a2"),
        ])
        data = gql.data("{ annotations { id term { id displayId } } }")
        assert data["annotations"] == [
            {"id": "a1", "term": {"id": "GO:0000422", "displayId": "GO:0000422"}},
            {"id": "a2", "term": {"id": "UNKNOWN:0001", "displayId": ""}},
        ]

    def test_no_hits(self, gql, es_mock):
        es_mock.search.return_value = filtered_search_response()
        assert gql.data("{ annotations { id } }") == {"annotations": []}

    def test_every_filter_argument_reaches_elasticsearch(self, gql, es_mock):
        es_mock.search.return_value = filtered_search_response()
        gql.data(ANNOTATIONS, {"f": ALL_ANNOTATION_FILTERS})
        assert same_clauses(es_mock.search.await_args.kwargs["query"]["bool"]["filter"], ALL_ANNOTATION_CLAUSES)

    def test_null_and_empty_filters_are_ignored(self, gql, es_mock):
        es_mock.search.return_value = filtered_search_response()
        gql.data(ANNOTATIONS, {"f": {"geneIds": None, "termIds": [], "slimTermIds": None}})
        assert es_mock.search.await_args.kwargs["query"] == MATCH_ALL

    def test_a_single_value_is_coerced_to_a_list(self, gql, es_mock):
        es_mock.search.return_value = filtered_search_response()
        gql.data(ANNOTATIONS, {"f": {"termIds": "GO:0000422"}})
        assert es_mock.search.await_args.kwargs["query"] == \
            {"bool": {"filter": [{"terms": {"term.id.keyword": ["GO:0000422"]}}]}}

    @pytest.mark.parametrize("page_args, offset, size", [
        (None, 0, 50),
        ({}, 0, 50),
        ({"size": 5}, 0, 5),
        ({"page": 2}, 100, 50),
        ({"page": 2, "size": 5}, 10, 5),
    ])
    def test_paging(self, gql, es_mock, page_args, offset, size):
        es_mock.search.return_value = filtered_search_response()
        gql.data(ANNOTATIONS, {"p": page_args})
        kwargs = es_mock.search.await_args.kwargs
        assert (kwargs["from_"], kwargs["size"]) == (offset, size)

    @pytest.mark.xfail(strict=True, raises=AssertionError,
                       reason="BUG: pageArgs {page: null} is legal GraphQL but fails with a TypeError")
    def test_null_page_means_the_first_page(self, gql, es_mock):
        es_mock.search.return_value = filtered_search_response()
        gql.data(ANNOTATIONS, {"p": {"page": None, "size": 5}})


class TestAnnotationsCount:

    def test_count(self, gql, es_mock):
        es_mock.count.return_value = count_response(14)
        data = gql.data('{ annotationsCount(filterArgs: {termTypeIds: ["known"]}) { total } }')
        assert data == {"annotationsCount": {"total": 14}}
        es_mock.count.assert_awaited_once_with(
            index=ANNOTATIONS_INDEX, query={"bool": {"filter": [{"terms": {"term_type": ["known"]}}]}})

    def test_every_filter_argument_reaches_elasticsearch(self, gql, es_mock):
        es_mock.count.return_value = count_response(1)
        gql.data("query($f: AnnotationFilterArgs) { annotationsCount(filterArgs: $f) { total } }",
                 {"f": ALL_ANNOTATION_FILTERS})
        assert same_clauses(es_mock.count.await_args.kwargs["query"]["bool"]["filter"], ALL_ANNOTATION_CLAUSES)


class TestAnnotationsExport:

    def test_data_is_a_json_string(self, gql, es_mock):
        es_mock.search.return_value = filtered_search_response([hit({
            "gene": "UniProtKB:Q9UNH6", "gene_symbol": "SNX7",
            "term": {"id": "GO:0000422", "label": "autophagy of mitochondrion"}})])
        data = gql.data('{ annotationsExport(filterArgs: {geneIds: ["UniProtKB:Q9UNH6"]}) { data } }')
        assert json.loads(data["annotationsExport"]["data"]) == [{
            "gene": "UniProtKB:Q9UNH6", "gene_symbol": "SNX7",
            "term_id": "GO:0000422", "term_label": "autophagy of mitochondrion"}]
        assert es_mock.search.await_args.kwargs["query"] == \
            {"bool": {"filter": [{"terms": {"gene.keyword": ["UniProtKB:Q9UNH6"]}}]}}


class TestGenes:

    def test_full_document(self, gql, es_mock):
        respond_with_genes(es_mock, gene_doc())
        data = gql.data(f"{{ genes {{ {GENE_FIELDS} }} }}")
        assert data["genes"] == [{
            "gene": "UniProtKB:Q9UNH6",
            "geneSymbol": "SNX7",
            "geneName": "Sorting nexin-7",
            "namedGene": True,
            "longId": "HUMAN|HGNC=14971|UniProtKB=Q9UNH6",
            "pantherFamily": "PTHR45949",
            "taxonAbbr": "Hsa",
            "taxonLabel": "Homo sapiens",
            "taxonId": "9606",  # stored as an int in the genes index
            "coordinatesChrNum": "1",
            "coordinatesStart": 98662223,
            "coordinatesEnd": 98760498,
            "coordinatesStrand": None,
            "termCount": 2,
            "terms": [
                {"id": "GO:0000422", "label": "autophagy of mitochondrion", "displayId": "GO:0000422",
                 "aspect": "biological process", "evidenceType": "homology", "parentIds": ["GO:0006914"]},
                {"id": "UNKNOWN:0001", "label": "Unknown molecular function", "displayId": "",
                 "aspect": "molecular function", "evidenceType": "n/a", "parentIds": []},
            ],
            "slimTerms": [
                {"id": "GO:0006914", "label": "autophagy", "displayId": "GO:0006914",
                 "aspect": "biological process", "evidenceType": "homology"},
                {"id": "UNKNOWN:0001", "label": "Unknown molecular function", "displayId": "",
                 "aspect": "molecular function", "evidenceType": "n/a"},
            ],
        }]

    def test_filter_and_page_arguments(self, gql, es_mock):
        respond_with_genes(es_mock, gene_doc())
        gql.data(GENES, {
            "f": {"termIds": ["GO:0000422"], "slimTermIds": ["GO:0006914"], "geneIds": ["UniProtKB:Q9UNH6"]},
            "p": {"page": 1, "size": 2},
        })
        first = es_mock.search.await_args_list[0].kwargs
        assert (first["from_"], first["size"]) == (2, 2)
        assert same_clauses(first["query"]["bool"]["filter"], [
            {"bool": {"must": [
                {"nested": {"path": "terms", "query": {"term": {"terms.id.keyword": "GO:0000422"}}}},
                {"nested": {"path": "slim_terms", "query": {"term": {"slim_terms.id.keyword": "GO:0006914"}}}},
            ]}},
            {"terms": {"gene.keyword": ["UniProtKB:Q9UNH6"]}},
        ])

    def test_no_matches_is_a_single_request(self, gql, es_mock):
        es_mock.search.return_value = search_response()
        assert gql.data(GENES) == {"genes": []}
        es_mock.search.assert_awaited_once()

    @pytest.mark.xfail(strict=True, raises=AssertionError,
                       reason="BUG: genes come back in index order, not the requested sort order")
    def test_genes_come_back_in_sorted_order(self, gql, es_mock):
        dusp27 = gene_doc(gene="UniProtKB:Q5VZP5", gene_symbol="DUSP27")
        snx7 = gene_doc(gene="UniProtKB:Q9UNH6", gene_symbol="SNX7")
        es_mock.search.side_effect = [
            search_response([hit({}, id="dusp27", index=GENES_INDEX), hit({}, id="snx7", index=GENES_INDEX)]),
            search_response([hit(snx7, id="snx7", index=GENES_INDEX), hit(dusp27, id="dusp27", index=GENES_INDEX)]),
        ]
        assert [g["geneSymbol"] for g in gql.data(GENES)["genes"]] == ["DUSP27", "SNX7"]


class TestGenesCount:

    def test_count(self, gql, es_mock):
        es_mock.count.return_value = count_response(1)
        data = gql.data('{ genesCount(filterArgs: {termIds: ["GO:0000422"]}) { total } }')
        assert data == {"genesCount": {"total": 1}}
        es_mock.count.assert_awaited_once_with(index=GENES_INDEX, query={"bool": {"filter": [{"bool": {"must": [
            {"nested": {"path": "terms", "query": {"term": {"terms.id.keyword": "GO:0000422"}}}}]}}]}})


class TestGeneStats:

    def test_buckets(self, gql, es_mock):
        es_mock.search.return_value = search_response(aggregations=slim_term_frequency(
            slim_term_bucket("UNKNOWN:0001", "Unknown molecular function", "molecular function", genes=3),
            slim_term_bucket("GO:0005737", "cytoplasm", "cellular component", genes=2),
        ))
        data = gql.data("{ geneStats { slimTermFrequency { buckets { key docCount meta { id label aspect displayId parentIds } } } } }")
        assert data["geneStats"]["slimTermFrequency"]["buckets"] == [
            {"key": "UNKNOWN:0001", "docCount": 3, "meta": {"id": "UNKNOWN:0001", "label": "Unknown molecular function",
                                                           "aspect": "molecular function", "displayId": "", "parentIds": None}},
            {"key": "GO:0005737", "docCount": 2, "meta": {"id": "GO:0005737", "label": "cytoplasm",
                                                         "aspect": "cellular component", "displayId": "GO:0005737", "parentIds": None}},
        ]

    def test_filters(self, gql, es_mock):
        es_mock.search.return_value = search_response(aggregations=slim_term_frequency())
        gql.data('{ geneStats(filterArgs: {geneIds: ["UniProtKB:Q9UNH6"]}) { slimTermFrequency { buckets { key } } } }')
        assert es_mock.search.await_args.kwargs["query"] == \
            {"bool": {"filter": [{"terms": {"gene.keyword": ["UniProtKB:Q9UNH6"]}}]}}


class TestTermStats:

    def test_buckets(self, gql, es_mock):
        es_mock.search.return_value = search_response(aggregations=term_frequency(
            term_bucket("GO:0000422", "autophagy of mitochondrion", "biological process", genes=1,
                        slim_ids=["GO:0007005", "GO:0006914"])))
        data = gql.data("{ termStats { termFrequency { buckets { key docCount meta { id label aspect displayId parentIds } } } } }")
        assert data["termStats"]["termFrequency"]["buckets"] == [{
            "key": "GO:0000422", "docCount": 1,
            "meta": {"id": "GO:0000422", "label": "autophagy of mitochondrion", "aspect": "biological process",
                     "displayId": "GO:0000422", "parentIds": ["GO:0007005", "GO:0006914"]},
        }]

    def test_term_filter_resolves_genes_then_aggregates_their_annotations(self, gql, es_mock):
        es_mock.search.side_effect = [
            search_response([hit({"gene": "UniProtKB:Q9UNH6"}, index=GENES_INDEX)]),
            search_response(aggregations=term_frequency()),
        ]
        gql.data('{ termStats(filterArgs: {termIds: ["GO:0000422"]}) { termFrequency { buckets { key } } } }')
        genes_call, annotations_call = es_mock.search.await_args_list
        assert genes_call.kwargs["index"] == GENES_INDEX
        assert annotations_call.kwargs["query"] == \
            {"bool": {"filter": [{"terms": {"gene.keyword": ["UniProtKB:Q9UNH6"]}}]}}

    def test_no_matching_genes(self, gql, es_mock):
        es_mock.search.return_value = search_response()
        data = gql.data('{ termStats(filterArgs: {termIds: ["GO:9999999"]}) { termFrequency { buckets { key } } } }')
        assert data == {"termStats": {"termFrequency": {"buckets": []}}}


class TestAutocomplete:

    def test_gene_suggestions(self, gql, es_mock):
        es_mock.search.return_value = filtered_search_response([hit(gene_doc(), id="g1", index=GENES_INDEX)])
        data = gql.data('{ autocomplete(autocompleteType: gene, keyword: "snx") { gene geneSymbol geneName } }')
        assert data == {"autocomplete": [{"gene": "UniProtKB:Q9UNH6", "geneSymbol": "SNX7", "geneName": "Sorting nexin-7"}]}
        assert es_mock.search.await_args.kwargs["query"]["multi_match"]["query"] == "snx"

    def test_keyword_is_required(self, gql):
        (error,) = gql.errors("{ autocomplete(autocompleteType: gene) { gene } }")
        assert "argument 'keyword'" in error["message"]

    @pytest.mark.xfail(strict=True, raises=AssertionError,
                       reason="BUG: slim_term autocomplete with filterArgs raises AttributeError (term_type_ids)")
    def test_slim_term_suggestions_accept_filters(self, gql, es_mock):
        es_mock.search.return_value = filtered_search_response()
        gql.data('{ autocomplete(autocompleteType: slim_term, keyword: "auto", '
                 'filterArgs: {slimTermIds: ["GO:0006914"]}) { gene } }')


class TestSlimTermsAutocomplete:

    def test_terms(self, gql, es_mock):
        es_mock.search.return_value = search_response(aggregations=slim_label_frequency(
            slim_label_bucket("GO:0006914", "autophagy", "biological process", 2)))
        data = gql.data('{ slimTermsAutocomplete(keyword: "auto") { id label aspect count } }')
        assert data == {"slimTermsAutocomplete": [
            {"id": "GO:0006914", "label": "autophagy", "aspect": "biological process", "count": 2}]}

    def test_filters(self, gql, es_mock):
        es_mock.search.return_value = search_response(aggregations=slim_label_frequency())
        gql.data('{ slimTermsAutocomplete(keyword: "auto", filterArgs: {geneIds: ["UniProtKB:Q9UNH6"]}) { id } }')
        assert es_mock.search.await_args.kwargs["query"]["bool"]["filter"] == \
            [{"terms": {"gene.keyword": ["UniProtKB:Q9UNH6"]}}]

    @pytest.mark.xfail(strict=True, raises=AssertionError,
                       reason="BUG: displayId is never set for autocomplete terms")
    def test_display_id(self, gql, es_mock):
        es_mock.search.return_value = search_response(aggregations=slim_label_frequency(
            slim_label_bucket("GO:0006914", "autophagy", "biological process", 2)))
        data = gql.data('{ slimTermsAutocomplete(keyword: "auto") { displayId } }')
        assert data == {"slimTermsAutocomplete": [{"displayId": "GO:0006914"}]}
