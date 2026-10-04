"""autocomplete and slimTermsAutocomplete resolvers against a mocked ES."""
import pytest

from src.models.annotation_model import AnnotationFilterArgs, GeneFilterArgs
from src.models.base_model import AutocompleteType
from src.resolvers.autocomplete_resolver import (
    get_autocomplete,
    get_slim_term_autocomplete_query,
    get_slim_term_autocomplete_query_multi,
)
from tests.factories import (
    GENES_INDEX,
    filtered_search_response,
    gene_doc,
    hit,
    search_response,
    slim_label_bucket,
    slim_label_frequency,
)

AUTOCOMPLETE_FILTER_PATH = "took,hits.hits._score,**hits.hits._id**,**hits.hits._source**"


class TestGeneAutocomplete:

    async def test_request(self, es_mock):
        es_mock.search.return_value = filtered_search_response()
        await get_autocomplete(GENES_INDEX, AutocompleteType.gene, "snx", None)
        es_mock.search.assert_awaited_once_with(
            index=GENES_INDEX,
            filter_path=AUTOCOMPLETE_FILTER_PATH,
            query={"multi_match": {"query": "snx", "fields": ["gene", "gene_symbol", "gene_name"], "type": "best_fields"}},
            collapse={"field": "gene.keyword"},
            size=20,
        )

    async def test_hits_become_genes(self, es_mock):
        es_mock.search.return_value = filtered_search_response([
            hit(gene_doc(), id="g1", index=GENES_INDEX),
            hit(gene_doc(gene="SGD:S000003573", gene_symbol="SNX4"), id="g2", index=GENES_INDEX),
        ])
        genes = await get_autocomplete(GENES_INDEX, AutocompleteType.gene, "snx", None)
        assert [(g.gene, g.gene_symbol) for g in genes] == [("UniProtKB:Q9UNH6", "SNX7"), ("SGD:S000003573", "SNX4")]
        assert genes[0].terms[0].display_id == "GO:0000422"

    async def test_no_hits(self, es_mock):
        es_mock.search.return_value = filtered_search_response()
        assert await get_autocomplete(GENES_INDEX, AutocompleteType.gene, "zzz", None) == []


class TestSlimTermAutocompleteType:

    async def test_request_uses_the_slim_term_query(self, es_mock):
        es_mock.search.return_value = filtered_search_response()
        await get_autocomplete(GENES_INDEX, AutocompleteType.slim_term, "autophagy", None)
        query, collapse = await get_slim_term_autocomplete_query("autophagy", None)
        kwargs = es_mock.search.await_args.kwargs
        assert (kwargs["index"], kwargs["query"], kwargs["collapse"], kwargs["size"]) == (GENES_INDEX, query, collapse, 20)

    @pytest.mark.xfail(strict=True, raises=AttributeError,
                       reason="BUG: GeneFilterArgs is passed to get_annotations_query (AttributeError: term_type_ids)")
    async def test_accepts_filter_args(self, es_mock):
        es_mock.search.return_value = filtered_search_response()
        await get_autocomplete(GENES_INDEX, AutocompleteType.slim_term, "autophagy",
                               GeneFilterArgs(slim_term_ids=["GO:0006914"]))


class TestSlimTermsAutocomplete:

    async def test_request(self, es_mock):
        es_mock.search.return_value = search_response(aggregations=slim_label_frequency())
        await get_slim_term_autocomplete_query_multi(GENES_INDEX, "autoph", None)
        kwargs = es_mock.search.await_args.kwargs
        # runs against the genes index even though it takes AnnotationFilterArgs
        assert (kwargs["index"], kwargs["size"]) == (GENES_INDEX, 0)
        assert kwargs["query"] == {"bool": {"filter": [], "must": [{"nested": {"path": "slim_terms", "query": {
            "multi_match": {"query": "autoph", "type": "phrase_prefix", "fields": ["slim_terms.id", "slim_terms.label"]}}}}]}}
        by_label = kwargs["aggs"]["slim_term_frequency"]["aggs"]["distinct_slim_term_frequency"]
        assert kwargs["aggs"]["slim_term_frequency"]["nested"] == {"path": "slim_terms"}
        assert by_label["terms"] == {"field": "slim_terms.label.keyword", "order": {"_count": "desc"}, "size": 20}

    async def test_filters_restrict_the_genes(self, es_mock):
        es_mock.search.return_value = search_response(aggregations=slim_label_frequency())
        await get_slim_term_autocomplete_query_multi(GENES_INDEX, "autoph", AnnotationFilterArgs(slim_term_ids=["GO:0005737"]))
        assert es_mock.search.await_args.kwargs["query"]["bool"]["filter"] == [
            {"nested": {"path": "slim_terms", "query": {"terms": {"slim_terms.id.keyword": ["GO:0005737"]}}}}]

    async def test_buckets_become_terms(self, es_mock):
        es_mock.search.return_value = search_response(aggregations=slim_label_frequency(
            slim_label_bucket("GO:0006914", "autophagy", "biological process", 2),
            slim_label_bucket("GO:0007005", "mitochondrion organization", "biological process", 1),
        ))
        terms = await get_slim_term_autocomplete_query_multi(GENES_INDEX, "auto", None)
        assert [(t.id, t.label, t.aspect, t.count) for t in terms] == [
            ("GO:0006914", "autophagy", "biological process", 2),
            ("GO:0007005", "mitochondrion organization", "biological process", 1),
        ]

    @pytest.mark.xfail(strict=True, raises=AssertionError,
                       reason="BUG: display_id is never set here; every other endpoint uses the GO id")
    async def test_go_terms_have_a_display_id(self, es_mock):
        es_mock.search.return_value = search_response(aggregations=slim_label_frequency(
            slim_label_bucket("GO:0006914", "autophagy", "biological process", 2)))
        (t,) = await get_slim_term_autocomplete_query_multi(GENES_INDEX, "auto", None)
        assert t.display_id == "GO:0006914"

    async def test_no_buckets(self, es_mock):
        es_mock.search.return_value = search_response(aggregations=slim_label_frequency())
        assert await get_slim_term_autocomplete_query_multi(GENES_INDEX, "zzz", None) == []
