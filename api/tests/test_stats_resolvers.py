"""Count and statistics resolvers against a mocked ES."""
import pytest

from src.models.annotation_model import AnnotationFilterArgs, GeneFilterArgs
from src.resolvers import annotation_stats_resolver, gene_stats_resolver
from src.resolvers.annotation_resolver import get_genes_query
from src.resolvers.annotation_stats_resolver import get_annotations_count, get_annotations_stats
from src.resolvers.gene_stats_resolver import (
    get_annotation_term_response_meta,
    get_annotation_terms_query,
    get_genes_count,
    get_genes_stats,
    get_slim_terms_query,
    get_terms_stats,
)
from tests.factories import (
    ANNOTATIONS_INDEX,
    GENES_INDEX,
    count_response,
    hit,
    keyword_frequency,
    search_response,
    slim_term_bucket,
    slim_term_frequency,
    term_bucket,
    term_frequency,
    top_hits,
)

MATCH_ALL = {"bool": {"filter": []}}
STATS_FILTER_PATH = "took,hits.total.value,aggregations"
SLIM_FILTER = {"nested": {"path": "slim_terms", "query": {"terms": {"slim_terms.id.keyword": ["GO:0006914"]}}}}


class TestCounts:

    async def test_annotations_count(self, es_mock):
        es_mock.count.return_value = count_response(22)
        result = await get_annotations_count(ANNOTATIONS_INDEX, AnnotationFilterArgs(term_type_ids=["known"]))
        es_mock.count.assert_awaited_once_with(
            index=ANNOTATIONS_INDEX, query={"bool": {"filter": [{"terms": {"term_type": ["known"]}}]}})
        assert result.total == 22

    async def test_genes_count(self, es_mock):
        es_mock.count.return_value = count_response(5)
        result = await get_genes_count(GENES_INDEX, GeneFilterArgs(gene_ids=["UniProtKB:Q9UNH6"]))
        es_mock.count.assert_awaited_once_with(
            index=GENES_INDEX, query={"bool": {"filter": [{"terms": {"gene.keyword": ["UniProtKB:Q9UNH6"]}}]}})
        assert result.total == 5

    @pytest.mark.parametrize("count, index, query", [
        (get_annotations_count, ANNOTATIONS_INDEX, MATCH_ALL),
        (get_genes_count, GENES_INDEX, None),  # the ES client omits a None query: match_all
    ], ids=["annotations", "genes"])
    async def test_without_filters_counts_everything(self, es_mock, count, index, query):
        es_mock.count.return_value = count_response(0)
        assert (await count(index, None)).total == 0
        es_mock.count.assert_awaited_once_with(index=index, query=query)


class TestGeneStats:

    async def test_request(self, es_mock):
        es_mock.search.return_value = search_response(aggregations=slim_term_frequency())
        await get_genes_stats(GENES_INDEX, None)
        es_mock.search.assert_awaited_once_with(
            index=GENES_INDEX, filter_path=STATS_FILTER_PATH, query=None,
            aggs={"slim_term_frequency": get_slim_terms_query()}, size=0)

    async def test_filters_become_the_query(self, es_mock):
        es_mock.search.return_value = search_response(aggregations=slim_term_frequency())
        await get_genes_stats(GENES_INDEX, GeneFilterArgs(gene_ids=["UniProtKB:Q9UNH6"]))
        assert es_mock.search.await_args.kwargs["query"] == \
            {"bool": {"filter": [{"terms": {"gene.keyword": ["UniProtKB:Q9UNH6"]}}]}}

    async def test_bucket_counts_genes_not_nested_documents(self, es_mock):
        es_mock.search.return_value = search_response(aggregations=slim_term_frequency(
            slim_term_bucket("GO:0006914", "autophagy", "biological process", genes=2, nested_docs=3)))
        (bucket,) = (await get_genes_stats(GENES_INDEX, None)).slim_term_frequency.buckets
        assert (bucket.key, bucket.doc_count) == ("GO:0006914", 2)

    async def test_bucket_meta_describes_the_slim_term(self, es_mock):
        es_mock.search.return_value = search_response(aggregations=slim_term_frequency(
            slim_term_bucket("UNKNOWN:0001", "Unknown molecular function", "molecular function", genes=3),
            slim_term_bucket("GO:0005737", "cytoplasm", "cellular component", genes=2),
        ))
        buckets = (await get_genes_stats(GENES_INDEX, None)).slim_term_frequency.buckets
        assert [(b.meta.id, b.meta.label, b.meta.aspect, b.meta.display_id) for b in buckets] == [
            ("UNKNOWN:0001", "Unknown molecular function", "molecular function", ""),
            ("GO:0005737", "cytoplasm", "cellular component", "GO:0005737"),
        ]

    async def test_no_buckets(self, es_mock):
        es_mock.search.return_value = search_response(aggregations=slim_term_frequency())
        assert (await get_genes_stats(GENES_INDEX, None)).slim_term_frequency.buckets == []


class TestTermStats:

    async def test_without_filters_only_annotations_are_aggregated(self, es_mock):
        es_mock.search.return_value = search_response(aggregations=term_frequency())
        await get_terms_stats(GENES_INDEX, ANNOTATIONS_INDEX, None)
        es_mock.search.assert_awaited_once_with(
            index=ANNOTATIONS_INDEX, filter_path=STATS_FILTER_PATH, query=MATCH_ALL,
            aggs={"term_frequency": get_annotation_terms_query()}, size=0)

    async def test_slim_term_filter_applies_to_annotations_directly(self, es_mock):
        es_mock.search.return_value = search_response(aggregations=term_frequency())
        await get_terms_stats(GENES_INDEX, ANNOTATIONS_INDEX, GeneFilterArgs(slim_term_ids=["GO:0006914"]))
        es_mock.search.assert_awaited_once()
        assert es_mock.search.await_args.kwargs["query"] == {"bool": {"filter": [SLIM_FILTER]}}

    @pytest.mark.parametrize("filter_args", [
        GeneFilterArgs(term_ids=["GO:0000422"]),
        GeneFilterArgs(gene_ids=["UniProtKB:Q9UNH6", "UniProtKB:Q5VZP5"]),
    ], ids=["term_ids", "gene_ids"])
    async def test_term_and_gene_filters_resolve_genes_first(self, es_mock, filter_args):
        es_mock.search.side_effect = [
            search_response([hit({"gene": "UniProtKB:Q9UNH6"}, index=GENES_INDEX),
                             hit({"gene": "UniProtKB:Q5VZP5"}, index=GENES_INDEX)]),
            search_response(aggregations=term_frequency()),
        ]
        await get_terms_stats(GENES_INDEX, ANNOTATIONS_INDEX, filter_args)
        genes_call, annotations_call = es_mock.search.await_args_list
        assert genes_call.kwargs == {
            "index": GENES_INDEX, "query": await get_genes_query(filter_args), "source": ["gene"], "size": 10000}
        # then every annotation of those genes is aggregated: co-annotated terms, not only the filter's
        assert annotations_call.kwargs["index"] == ANNOTATIONS_INDEX
        assert annotations_call.kwargs["query"] == \
            {"bool": {"filter": [{"terms": {"gene.keyword": ["UniProtKB:Q9UNH6", "UniProtKB:Q5VZP5"]}}]}}

    async def test_slim_term_filter_combines_with_resolved_genes(self, es_mock):
        es_mock.search.side_effect = [
            search_response([hit({"gene": "UniProtKB:Q9UNH6"}, index=GENES_INDEX)]),
            search_response(aggregations=term_frequency()),
        ]
        await get_terms_stats(GENES_INDEX, ANNOTATIONS_INDEX,
                              GeneFilterArgs(term_ids=["GO:0000422"], slim_term_ids=["GO:0006914"]))
        _, annotations_call = es_mock.search.await_args_list
        assert annotations_call.kwargs["query"] == {"bool": {"filter": [
            SLIM_FILTER,
            {"terms": {"gene.keyword": ["UniProtKB:Q9UNH6"]}},
        ]}}

    async def test_no_matching_genes_returns_no_buckets(self, es_mock):
        es_mock.search.return_value = search_response()
        stats = await get_terms_stats(GENES_INDEX, ANNOTATIONS_INDEX, GeneFilterArgs(term_ids=["GO:9999999"]))
        assert stats.term_frequency.buckets == []
        es_mock.search.assert_awaited_once()

    async def test_bucket_counts_distinct_genes(self, es_mock):
        es_mock.search.return_value = search_response(aggregations=term_frequency(
            term_bucket("GO:0005737", "cytoplasm", "cellular component", genes=2, annotations=5)))
        (bucket,) = (await get_terms_stats(GENES_INDEX, ANNOTATIONS_INDEX, None)).term_frequency.buckets
        assert (bucket.key, bucket.doc_count) == ("GO:0005737", 2)

    async def test_bucket_meta_lists_the_slim_terms_as_parents(self, es_mock):
        es_mock.search.return_value = search_response(aggregations=term_frequency(
            term_bucket("GO:0000422", "autophagy of mitochondrion", "biological process", genes=1,
                        slim_ids=["GO:0007005", "GO:0006914"])))
        (bucket,) = (await get_terms_stats(GENES_INDEX, ANNOTATIONS_INDEX, None)).term_frequency.buckets
        meta = bucket.meta
        assert (meta.id, meta.label, meta.aspect, meta.display_id, meta.parent_ids) == (
            "GO:0000422", "autophagy of mitochondrion", "biological process", "GO:0000422",
            ["GO:0007005", "GO:0006914"])


class TestAnnotationStats:
    """``get_annotations_stats`` has no GraphQL field; the UI's annotationStats query is stale."""

    @staticmethod
    def aggregations():
        return {
            "aspect_frequency": keyword_frequency({"biological process": 9, "molecular function": 7}),
            "evidence_type_frequency": keyword_frequency({"homology": 10, "n/a": 8, "direct": 4}),
            "term_type_frequency": keyword_frequency({"known": 14, "unknown": 8}),
        }

    async def test_request(self, es_mock):
        es_mock.search.return_value = search_response(aggregations=self.aggregations())
        await get_annotations_stats(ANNOTATIONS_INDEX, None)
        kwargs = es_mock.search.await_args.kwargs
        assert (kwargs["index"], kwargs["query"], kwargs["size"]) == (ANNOTATIONS_INDEX, MATCH_ALL, 0)
        assert {name: (agg["terms"]["field"], agg["terms"]["size"]) for name, agg in kwargs["aggs"].items()} == {
            "aspect_frequency": ("term.aspect.keyword", 20),
            "evidence_type_frequency": ("evidence_type.keyword", 20),
            "term_type_frequency": ("term_type.keyword", 2),
        }

    async def test_frequencies(self, es_mock):
        es_mock.search.return_value = search_response(aggregations=self.aggregations())
        stats = await get_annotations_stats(ANNOTATIONS_INDEX, None)
        pairs = lambda frequency: [(b.key, b.doc_count) for b in frequency.buckets]
        assert pairs(stats.aspect_frequency) == [("biological process", 9), ("molecular function", 7)]
        assert pairs(stats.evidence_type_frequency) == [("homology", 10), ("n/a", 8), ("direct", 4)]
        assert pairs(stats.term_type_frequency) == [("known", 14), ("unknown", 8)]


class TestResponseMeta:

    @pytest.fixture(params=[annotation_stats_resolver.get_response_meta, gene_stats_resolver.get_response_meta],
                    ids=["annotation_stats_resolver", "gene_stats_resolver"])
    def get_response_meta(self, request):
        return request.param

    def test_entity_from_the_first_hit(self, get_response_meta):
        meta = get_response_meta(top_hits(
            {"id": "GO:0006914", "label": "autophagy", "aspect": "biological process"},
            {"id": "GO:0007005", "label": "mitochondrion organization", "aspect": "biological process"},
        ))
        assert (meta.id, meta.label, meta.aspect, meta.display_id) == \
            ("GO:0006914", "autophagy", "biological process", "GO:0006914")

    def test_non_go_ids_have_no_display_id(self, get_response_meta):
        meta = get_response_meta(top_hits({"id": "UNKNOWN:0001", "label": "Unknown", "aspect": "molecular function"}))
        assert meta.display_id == ""

    @pytest.mark.parametrize("bucket", [{"hits": {"hits": []}}, {}], ids=["no-hits", "no-hits-key"])
    def test_no_hits_means_no_meta(self, get_response_meta, bucket):
        assert get_response_meta(bucket) is None


class TestAnnotationTermResponseMeta:

    @staticmethod
    def bucket(**source):
        return top_hits({"term": {"id": "GO:0000422", "label": "autophagy of mitochondrion",
                                  "aspect": "biological process"}, **source})

    def test_parent_ids_are_the_slim_term_ids(self):
        meta = get_annotation_term_response_meta(self.bucket(slim_terms=[{"id": "GO:0007005"}, {"id": "GO:0006914"}]))
        assert (meta.id, meta.label, meta.aspect, meta.display_id, meta.parent_ids) == (
            "GO:0000422", "autophagy of mitochondrion", "biological process", "GO:0000422",
            ["GO:0007005", "GO:0006914"])

    @pytest.mark.parametrize("source", [{}, {"slim_terms": []}, {"slim_terms": None}],
                             ids=["missing", "empty", "null"])
    def test_without_slim_terms_parent_ids_are_empty(self, source):
        assert get_annotation_term_response_meta(self.bucket(**source)).parent_ids == []

    def test_slim_terms_without_an_id_are_skipped(self):
        meta = get_annotation_term_response_meta(self.bucket(slim_terms=[{}, {"id": "GO:0006914"}, {"id": None}]))
        assert meta.parent_ids == ["GO:0006914"]

    def test_missing_aspect_is_empty(self):
        meta = get_annotation_term_response_meta(top_hits({"term": {"id": "UNKNOWN:0001", "label": "Unknown"}}))
        assert (meta.aspect, meta.display_id) == ("", "")

    @pytest.mark.parametrize("bucket", [
        top_hits({"slim_terms": [{"id": "GO:0006914"}]}),
        top_hits({"term": None}),
        {"hits": {"hits": []}},
    ], ids=["no-term", "null-term", "no-hits"])
    def test_no_term_means_no_meta(self, bucket):
        assert get_annotation_term_response_meta(bucket) is None
