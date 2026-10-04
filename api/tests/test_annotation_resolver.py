"""annotation_resolver: annotation, annotations, genes and annotationsExport against a mocked ES."""
import json

import pytest
from elasticsearch import NotFoundError

from src.models.annotation_model import AnnotationFilterArgs, GeneFilterArgs
from src.models.base_model import PageArgs
from src.resolvers.annotation_resolver import get_annotation, get_annotations, get_annotations_export, get_genes
from tests.factories import (
    ANNOTATIONS_INDEX,
    GENES_INDEX,
    annotation_doc,
    api_error,
    filtered_search_response,
    gene_doc,
    get_response,
    hit,
    search_response,
    term,
)

MATCH_ALL = {"bool": {"filter": []}}
ANNOTATIONS_FILTER_PATH = "took,hits.hits._score,**hits.hits._id**, **hits.hits._source**"
GENE_SORT = [{"sort_priority": {"order": "asc"}}, {"gene_symbol.keyword": {"order": "asc"}}]
PAGES = [(0, 10, 0), (1, 10, 10), (3, 25, 75)]


class TestGetAnnotation:

    async def test_fetches_the_document_by_id(self, es_mock):
        es_mock.get.return_value = get_response(annotation_doc(), id="a1")
        annotation = await get_annotation(ANNOTATIONS_INDEX, "a1")
        es_mock.get.assert_awaited_once_with(index=ANNOTATIONS_INDEX, id="a1")
        assert (annotation.id, annotation.gene, annotation.term.id) == ("a1", "UniProtKB:Q9UNH6", "GO:0000422")

    async def test_missing_document_raises_not_found(self, es_mock):
        es_mock.get.side_effect = api_error(NotFoundError, 404, {"_index": ANNOTATIONS_INDEX, "_id": "nope", "found": False})
        with pytest.raises(NotFoundError):
            await get_annotation(ANNOTATIONS_INDEX, "nope")


class TestGetAnnotations:

    async def test_default_request(self, es_mock):
        es_mock.search.return_value = filtered_search_response()
        await get_annotations(ANNOTATIONS_INDEX, None, None)
        es_mock.search.assert_awaited_once_with(
            index=ANNOTATIONS_INDEX, filter_path=ANNOTATIONS_FILTER_PATH, query=MATCH_ALL, from_=0, size=50)

    @pytest.mark.parametrize("page, size, offset", PAGES)
    async def test_paging(self, es_mock, page, size, offset):
        es_mock.search.return_value = filtered_search_response()
        await get_annotations(ANNOTATIONS_INDEX, None, PageArgs(page=page, size=size))
        kwargs = es_mock.search.await_args.kwargs
        assert (kwargs["from_"], kwargs["size"]) == (offset, size)

    async def test_filters_become_the_query(self, es_mock):
        es_mock.search.return_value = filtered_search_response()
        await get_annotations(ANNOTATIONS_INDEX, AnnotationFilterArgs(gene_ids=["UniProtKB:Q9UNH6"]), None)
        assert es_mock.search.await_args.kwargs["query"] == \
            {"bool": {"filter": [{"terms": {"gene.keyword": ["UniProtKB:Q9UNH6"]}}]}}

    async def test_hits_become_annotations_in_order(self, es_mock):
        es_mock.search.return_value = filtered_search_response([
            hit(annotation_doc(term=term("GO:0000422")), id="a1"),
            hit(annotation_doc(term=term("GO:0005769")), id="a2"),
        ])
        annotations = await get_annotations(ANNOTATIONS_INDEX, None, None)
        assert [(a.id, a.term.id) for a in annotations] == [("a1", "GO:0000422"), ("a2", "GO:0005769")]

    async def test_no_hits(self, es_mock):
        es_mock.search.return_value = filtered_search_response()
        assert await get_annotations(ANNOTATIONS_INDEX, None, None) == []

    @pytest.mark.xfail(strict=True, raises=TypeError,
                       reason="BUG: pageArgs {page: null} is legal GraphQL but reaches None * size")
    async def test_null_page_means_the_first_page(self, es_mock):
        es_mock.search.return_value = filtered_search_response()
        await get_annotations(ANNOTATIONS_INDEX, None, PageArgs(page=None, size=10))
        assert es_mock.search.await_args.kwargs["from_"] == 0


class TestGetGenes:

    @staticmethod
    def respond(es_mock, *docs):
        """First search: the page of ids. Second search: the documents for those ids."""
        es_mock.search.side_effect = [
            search_response([hit({}, id=f"g{i}", index=GENES_INDEX) for i in range(len(docs))]),
            search_response([hit(doc, id=f"g{i}", index=GENES_INDEX) for i, doc in enumerate(docs)]),
        ]

    async def test_first_request_selects_a_sorted_page_of_ids(self, es_mock):
        self.respond(es_mock, gene_doc())
        await get_genes(GENES_INDEX, None, None)
        first = es_mock.search.await_args_list[0]
        # query=None: see TestGenesQuery.test_no_filter_args_send_no_query
        assert first.kwargs == {
            "index": GENES_INDEX, "query": None, "from_": 0, "size": 50, "source": ["_id"], "sort": GENE_SORT}

    async def test_second_request_fetches_those_documents(self, es_mock):
        self.respond(es_mock, gene_doc(), gene_doc(gene="UniProtKB:Q5VZP5", gene_symbol="DUSP27"))
        await get_genes(GENES_INDEX, None, None)
        second = es_mock.search.await_args_list[1]
        assert second.kwargs == {"index": GENES_INDEX, "query": {"ids": {"values": ["g0", "g1"]}}, "size": 2}

    @pytest.mark.parametrize("page, size, offset", PAGES)
    async def test_paging(self, es_mock, page, size, offset):
        self.respond(es_mock, gene_doc())
        await get_genes(GENES_INDEX, None, PageArgs(page=page, size=size))
        first = es_mock.search.await_args_list[0]
        assert (first.kwargs["from_"], first.kwargs["size"]) == (offset, size)

    async def test_filters_apply_to_the_id_query(self, es_mock):
        self.respond(es_mock, gene_doc())
        await get_genes(GENES_INDEX, GeneFilterArgs(gene_ids=["UniProtKB:Q9UNH6"]), None)
        first = es_mock.search.await_args_list[0]
        assert first.kwargs["query"] == {"bool": {"filter": [{"terms": {"gene.keyword": ["UniProtKB:Q9UNH6"]}}]}}

    async def test_documents_become_genes(self, es_mock):
        self.respond(es_mock, gene_doc())
        (gene,) = await get_genes(GENES_INDEX, None, None)
        assert (gene.gene, gene.gene_symbol, gene.term_count) == ("UniProtKB:Q9UNH6", "SNX7", 2)
        assert [t.id for t in gene.terms] == ["GO:0000422", "UNKNOWN:0001"]

    async def test_no_matching_genes_skips_the_second_request(self, es_mock):
        es_mock.search.return_value = search_response()
        assert await get_genes(GENES_INDEX, None, None) == []
        es_mock.search.assert_awaited_once()

    @pytest.mark.xfail(strict=True, raises=AssertionError,
                       reason="BUG: the ids lookup returns documents in index order, discarding the "
                              "sort_priority/gene_symbol sort of the first request")
    async def test_genes_keep_the_sorted_order(self, es_mock):
        dusp27 = gene_doc(gene="UniProtKB:Q5VZP5", gene_symbol="DUSP27")
        snx7 = gene_doc(gene="UniProtKB:Q9UNH6", gene_symbol="SNX7")
        es_mock.search.side_effect = [
            search_response([hit({}, id="dusp27", index=GENES_INDEX), hit({}, id="snx7", index=GENES_INDEX)]),
            # an ids query returns documents in index order, not in the order the ids were given
            search_response([hit(snx7, id="snx7", index=GENES_INDEX), hit(dusp27, id="dusp27", index=GENES_INDEX)]),
        ]
        genes = await get_genes(GENES_INDEX, None, None)
        assert [g.gene_symbol for g in genes] == ["DUSP27", "SNX7"]


class TestGetAnnotationsExport:

    async def test_request(self, es_mock):
        es_mock.search.return_value = filtered_search_response()
        await get_annotations_export(ANNOTATIONS_INDEX, None, None)
        es_mock.search.assert_awaited_once_with(
            source=["gene", "gene_symbol", "term.id", "term.label"],
            index=ANNOTATIONS_INDEX,
            filter_path="took,hits.hits._score,**hits.hits._source**",
            query=MATCH_ALL,
            from_=0,
            size=10000,
        )

    async def test_page_size_is_ignored(self, es_mock):
        es_mock.search.return_value = filtered_search_response()
        await get_annotations_export(ANNOTATIONS_INDEX, None, PageArgs(page=0, size=5))
        assert es_mock.search.await_args.kwargs["size"] == 10000

    async def test_filters_become_the_query(self, es_mock):
        es_mock.search.return_value = filtered_search_response()
        await get_annotations_export(ANNOTATIONS_INDEX, AnnotationFilterArgs(term_ids=["GO:0000422"]), None)
        assert es_mock.search.await_args.kwargs["query"] == \
            {"bool": {"filter": [{"terms": {"term.id.keyword": ["GO:0000422"]}}]}}

    async def test_rows_are_serialised_as_a_json_string(self, es_mock):
        es_mock.search.return_value = filtered_search_response([
            hit({"gene": "UniProtKB:Q9UNH6", "gene_symbol": "SNX7",
                 "term": {"id": "GO:0000422", "label": "autophagy of mitochondrion"}}),
            hit({"gene": "UniProtKB:Q5VZP5", "gene_symbol": "DUSP27",
                 "term": {"id": "UNKNOWN:0001", "label": "Unknown molecular function"}}),
        ])
        export = await get_annotations_export(ANNOTATIONS_INDEX, None, None)
        assert json.loads(export.data) == [
            {"gene": "UniProtKB:Q9UNH6", "gene_symbol": "SNX7", "term_id": "GO:0000422",
             "term_label": "autophagy of mitochondrion"},
            {"gene": "UniProtKB:Q5VZP5", "gene_symbol": "DUSP27", "term_id": "UNKNOWN:0001",
             "term_label": "Unknown molecular function"},
        ]

    async def test_no_hits_is_an_empty_json_list(self, es_mock):
        es_mock.search.return_value = filtered_search_response()
        assert (await get_annotations_export(ANNOTATIONS_INDEX, None, None)).data == "[]"

    @pytest.mark.xfail(strict=True, raises=AssertionError,
                       reason="BUG: from_=page*size with size=10000 exceeds index.max_result_window "
                              "(10,000) for every page after the first")
    async def test_stays_within_the_result_window(self, es_mock):
        es_mock.search.return_value = filtered_search_response()
        await get_annotations_export(ANNOTATIONS_INDEX, None, PageArgs(page=1, size=50))
        kwargs = es_mock.search.await_args.kwargs
        assert kwargs["from_"] + kwargs["size"] <= 10_000
