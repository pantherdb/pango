"""The loader's real output must load into the API types and serialise without GraphQL errors.

Documents come from loader/test_data/output/pango-test, exactly what index_es.py bulk-loads, so a
change to the loader's document shape that the API can't handle fails here instead of in production.
"""
import dataclasses

import pytest

from src.models.base_model import Reference
from src.models.term_model import Term
from tests.factories import GENES_INDEX, filtered_search_response, hit, search_response
from tests.helpers import EVERY_ANNOTATION_FIELD, EVERY_GENE_FIELD


def model_fields(cls):
    return {f.name for f in dataclasses.fields(cls)}


def annotations_via_api(gql, es_mock, docs):
    es_mock.search.return_value = filtered_search_response([hit(doc, id=f"a{i}") for i, doc in enumerate(docs)])
    query = f"query($p: PageArgs) {{ annotations(pageArgs: $p) {{ {EVERY_ANNOTATION_FIELD} }} }}"
    return gql.data(query, {"p": {"size": len(docs)}})["annotations"]


def genes_via_api(gql, es_mock, docs):
    es_mock.search.side_effect = [
        search_response([hit({}, id=f"g{i}", index=GENES_INDEX) for i in range(len(docs))]),
        search_response([hit(doc, id=f"g{i}", index=GENES_INDEX) for i, doc in enumerate(docs)]),
    ]
    query = f"query($p: PageArgs) {{ genes(pageArgs: $p) {{ {EVERY_GENE_FIELD} }} }}"
    return gql.data(query, {"p": {"size": len(docs)}})["genes"]


class TestDocumentShape:

    def test_every_term_key_is_modelled(self, loader_annotations, loader_genes):
        terms = [d["term"] for d in loader_annotations]
        terms += [t for d in loader_annotations for t in d["slim_terms"]]
        terms += [t for g in loader_genes for t in g["terms"] + g["slim_terms"]]
        unknown = set().union(*(t.keys() for t in terms)) - model_fields(Term)
        assert not unknown, f"Term(**doc) raises TypeError on loader keys {unknown}"

    def test_every_reference_has_exactly_the_modelled_keys(self, loader_annotations):
        references = [r for d in loader_annotations for e in d["evidence"] for r in e["references"] if r is not None]
        assert references
        assert all(r.keys() == model_fields(Reference) for r in references)


class TestAnnotations:

    def test_every_document_serialises(self, gql, es_mock, loader_annotations):
        annotations = annotations_via_api(gql, es_mock, loader_annotations)
        assert [(a["gene"], a["term"]["id"]) for a in annotations] == \
            [(d["gene"], d["term"]["id"]) for d in loader_annotations]

    def test_nested_documents_survive(self, gql, es_mock, loader_annotations):
        annotations = annotations_via_api(gql, es_mock, loader_annotations)
        for doc, annotation in zip(loader_annotations, annotations):
            assert [s["id"] for s in annotation["slimTerms"]] == [s["id"] for s in doc["slim_terms"]]
            assert [e["withGeneId"]["gene"] for e in annotation["evidence"]] == \
                [e["with_gene_id"]["gene"] for e in doc["evidence"]]
            assert annotation["evidenceCount"] == doc["evidence_count"]

    def test_reference_dates_are_epoch_millisecond_strings(self, gql, es_mock, loader_annotations):
        annotations = annotations_via_api(gql, es_mock, loader_annotations)
        served = [r["date"] for a in annotations for e in a["evidence"] for r in e["references"]]
        stored = [r["date"] for d in loader_annotations for e in d["evidence"] for r in e["references"] if r]
        assert served == [str(date) for date in stored]

    @pytest.mark.xfail(strict=True, raises=AssertionError,
                       reason="BUG (loader): annotation documents store coordinates_chr_num as a float, so "
                              "annotations report chromosome '1.0' where genes report '1'")
    def test_chromosome_matches_the_genes_index(self, gql, es_mock, loader_annotations, loader_genes):
        chromosome = {g["gene"]: str(g["coordinates_chr_num"]) for g in loader_genes}
        annotations = annotations_via_api(gql, es_mock, loader_annotations)
        assert [a["coordinatesChrNum"] for a in annotations] == [chromosome[a["gene"]] for a in annotations]


class TestGenes:

    def test_every_document_serialises(self, gql, es_mock, loader_genes):
        genes = genes_via_api(gql, es_mock, loader_genes)
        assert [g["gene"] for g in genes] == [d["gene"] for d in loader_genes]

    def test_terms_survive_with_parent_ids(self, gql, es_mock, loader_genes):
        genes = genes_via_api(gql, es_mock, loader_genes)
        for doc, gene in zip(loader_genes, genes):
            assert [(t["id"], t["parentIds"]) for t in gene["terms"]] == \
                [(t["id"], t["parent_ids"]) for t in doc["terms"]]
            assert [t["id"] for t in gene["slimTerms"]] == [t["id"] for t in doc["slim_terms"]]
            assert gene["termCount"] == doc["term_count"]

    def test_numeric_taxon_ids_are_served_as_strings(self, gql, es_mock, loader_genes):
        genes = genes_via_api(gql, es_mock, loader_genes)
        assert [g["taxonId"] for g in genes] == [str(d["taxon_id"]) for d in loader_genes]
