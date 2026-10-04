"""Elasticsearch query DSL built from GraphQL filter arguments."""
import pytest

from src.models.annotation_model import AnnotationFilterArgs, GeneFilterArgs
from src.resolvers.annotation_resolver import get_annotations_query, get_genes_query
from src.resolvers.autocomplete_resolver import get_gene_autocomplete_query, get_slim_term_autocomplete_query
from src.resolvers.gene_stats_resolver import get_annotation_terms_query, get_slim_terms_query
from tests.helpers import same_clauses

MATCH_ALL = {"bool": {"filter": []}}


def nested_term(path, value):
    return {"nested": {"path": path, "query": {"term": {f"{path}.id.keyword": value}}}}


class TestAnnotationsQuery:

    async def test_no_filter_args_match_everything(self):
        assert await get_annotations_query(None) == MATCH_ALL

    async def test_default_filter_args_match_everything(self):
        assert await get_annotations_query(AnnotationFilterArgs()) == MATCH_ALL

    @pytest.mark.parametrize("field, values, clause", [
        ("term_ids", ["GO:0000422", "GO:0005769"],
         {"terms": {"term.id.keyword": ["GO:0000422", "GO:0005769"]}}),
        ("term_type_ids", ["known"],
         {"terms": {"term_type": ["known"]}}),
        ("slim_term_ids", ["GO:0006914", "GO:0007005"],
         {"nested": {"path": "slim_terms", "query": {"terms": {"slim_terms.id.keyword": ["GO:0006914", "GO:0007005"]}}}}),
        ("gene_ids", ["UniProtKB:Q9UNH6"],
         {"terms": {"gene.keyword": ["UniProtKB:Q9UNH6"]}}),
        ("aspect_ids", ["biological process"],
         {"terms": {"term.aspect.keyword": ["biological process"]}}),
        ("evidence_type_ids", ["homology", "direct"],
         {"terms": {"evidence_type.keyword": ["homology", "direct"]}}),
    ])
    async def test_each_filter_matches_any_of_its_values(self, field, values, clause):
        query = await get_annotations_query(AnnotationFilterArgs(**{field: values}))
        assert query == {"bool": {"filter": [clause]}}

    async def test_different_filters_must_all_match(self):
        query = await get_annotations_query(AnnotationFilterArgs(
            term_ids=["GO:0000422"],
            term_type_ids=["known"],
            slim_term_ids=["GO:0006914"],
            gene_ids=["UniProtKB:Q9UNH6"],
            aspect_ids=["biological process"],
            evidence_type_ids=["homology"],
        ))
        assert list(query["bool"]) == ["filter"]
        assert same_clauses(query["bool"]["filter"], [
            {"terms": {"term.id.keyword": ["GO:0000422"]}},
            {"terms": {"term_type": ["known"]}},
            {"nested": {"path": "slim_terms", "query": {"terms": {"slim_terms.id.keyword": ["GO:0006914"]}}}},
            {"terms": {"gene.keyword": ["UniProtKB:Q9UNH6"]}},
            {"terms": {"term.aspect.keyword": ["biological process"]}},
            {"terms": {"evidence_type.keyword": ["homology"]}},
        ])

    @pytest.mark.parametrize("empty", [[], None], ids=["empty-list", "None"])
    async def test_empty_filters_are_ignored(self, empty):
        fields = ["term_ids", "term_type_ids", "slim_term_ids", "gene_ids", "aspect_ids", "evidence_type_ids"]
        assert await get_annotations_query(AnnotationFilterArgs(**{f: empty for f in fields})) == MATCH_ALL

    async def test_with_gene_and_reference_filters_are_ignored(self):
        # Known gap: accepted by the schema but never applied. Evidence is mapped with
        # "enabled": false, so it can't be filtered on without a mapping change.
        query = await get_annotations_query(AnnotationFilterArgs(
            with_gene_ids=["SGD:S000003573"], reference_ids=["PMID:19793921"]))
        assert query == MATCH_ALL


class TestGenesQuery:

    async def test_no_filter_args_send_no_query(self):
        # Unlike get_annotations_query, the return sits inside "if filter_args != None". The ES
        # client drops query=None from the request body, which Elasticsearch treats as match_all.
        assert await get_genes_query(None) is None

    async def test_default_filter_args_match_everything(self):
        assert await get_genes_query(GeneFilterArgs()) == MATCH_ALL

    async def test_gene_must_have_every_term(self):
        query = await get_genes_query(GeneFilterArgs(term_ids=["GO:0000422", "GO:0005769"]))
        assert query == {"bool": {"filter": [{"bool": {"must": [
            nested_term("terms", "GO:0000422"),
            nested_term("terms", "GO:0005769"),
        ]}}]}}

    async def test_gene_must_have_every_slim_term(self):
        query = await get_genes_query(GeneFilterArgs(slim_term_ids=["GO:0006914", "GO:0007005"]))
        assert query == {"bool": {"filter": [{"bool": {"must": [
            nested_term("slim_terms", "GO:0006914"),
            nested_term("slim_terms", "GO:0007005"),
        ]}}]}}

    async def test_terms_and_slim_terms_share_one_must_clause(self):
        query = await get_genes_query(GeneFilterArgs(term_ids=["GO:0000422"], slim_term_ids=["GO:0006914"]))
        assert query == {"bool": {"filter": [{"bool": {"must": [
            nested_term("terms", "GO:0000422"),
            nested_term("slim_terms", "GO:0006914"),
        ]}}]}}

    async def test_gene_ids_match_any_gene(self):
        query = await get_genes_query(GeneFilterArgs(gene_ids=["UniProtKB:Q9UNH6", "UniProtKB:Q5VZP5"]))
        assert query == {"bool": {"filter": [{"terms": {"gene.keyword": ["UniProtKB:Q9UNH6", "UniProtKB:Q5VZP5"]}}]}}

    async def test_term_and_gene_filters_combine(self):
        query = await get_genes_query(GeneFilterArgs(term_ids=["GO:0000422"], gene_ids=["UniProtKB:Q9UNH6"]))
        assert same_clauses(query["bool"]["filter"], [
            {"bool": {"must": [nested_term("terms", "GO:0000422")]}},
            {"terms": {"gene.keyword": ["UniProtKB:Q9UNH6"]}},
        ])

    @pytest.mark.parametrize("empty", [[], None], ids=["empty-list", "None"])
    async def test_empty_filters_are_ignored(self, empty):
        assert await get_genes_query(GeneFilterArgs(term_ids=empty, slim_term_ids=empty, gene_ids=empty)) == MATCH_ALL


class TestGeneAutocompleteQuery:

    async def test_matches_id_symbol_or_name_and_collapses_per_gene(self):
        query, collapse = await get_gene_autocomplete_query("snx", None)
        assert query == {"multi_match": {"query": "snx", "fields": ["gene", "gene_symbol", "gene_name"], "type": "best_fields"}}
        assert collapse == {"field": "gene.keyword"}

    async def test_filter_args_are_ignored(self):
        filtered = await get_gene_autocomplete_query("snx", GeneFilterArgs(gene_ids=["UniProtKB:Q5VZP5"]))
        assert filtered == await get_gene_autocomplete_query("snx", None)


class TestSlimTermAutocompleteQuery:
    """The query behind ``autocomplete(autocompleteType: slim_term)``; the UI doesn't use it."""

    async def test_keyword_must_match_a_slim_term(self):
        query, _ = await get_slim_term_autocomplete_query("autophagy", None)
        assert query["bool"]["filter"] == []
        (clause,) = query["bool"]["must"]
        assert clause["nested"]["path"] == "slim_terms"

    @pytest.mark.xfail(strict=True, raises=AssertionError,
                       reason="BUG: matches on slim_term.label (singular) inside the slim_terms nested path")
    async def test_match_field_belongs_to_the_nested_path(self):
        query, _ = await get_slim_term_autocomplete_query("autophagy", None)
        nested = query["bool"]["must"][0]["nested"]
        (field,) = nested["query"]["match"]
        assert field.startswith(nested["path"] + ".")

    @pytest.mark.xfail(strict=True, raises=AttributeError,
                       reason="BUG: autocomplete passes GeneFilterArgs to get_annotations_query, "
                              "which reads AnnotationFilterArgs-only fields (term_type_ids)")
    async def test_accepts_gene_filter_args(self):
        await get_slim_term_autocomplete_query("autophagy", GeneFilterArgs(slim_term_ids=["GO:0006914"]))


class TestAggregations:

    def test_slim_term_frequency_counts_genes_per_slim_term(self):
        agg = get_slim_terms_query()
        assert agg["nested"] == {"path": "slim_terms"}
        by_slim_term = agg["aggs"]["distinct_slim_term_frequency"]
        assert by_slim_term["terms"] == {"field": "slim_terms.id.keyword", "order": {"_count": "desc"}, "size": 200}
        # reverse_nested climbs back to the gene documents, so each gene is counted once
        assert by_slim_term["aggs"]["distinct_genes"] == {
            "reverse_nested": {}, "aggs": {"gene_count": {"value_count": {"field": "gene.keyword"}}}}
        assert by_slim_term["aggs"]["docs"]["top_hits"] == {
            "_source": {"includes": ["slim_terms.id", "slim_terms.label", "slim_terms.aspect"]}, "size": 1}

    def test_term_frequency_counts_distinct_genes_per_term(self):
        agg = get_annotation_terms_query()
        assert agg["terms"] == {"field": "term.id.keyword", "order": {"_count": "desc"}, "size": 200}
        assert agg["aggs"]["distinct_genes"] == {"cardinality": {"field": "gene.keyword"}}
        assert agg["aggs"]["docs"]["top_hits"] == {
            "_source": {"includes": ["term.id", "term.label", "term.aspect", "slim_terms.id"]}, "size": 1}
