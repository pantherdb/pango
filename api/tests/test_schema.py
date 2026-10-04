"""The published GraphQL schema: the contract clients code against.

Changes here are API changes; update these tests deliberately.
"""
import pytest
from graphql import Undefined, build_schema

from src.app import schema

# Rebuilt from the printed SDL, i.e. exactly what clients see through introspection.
SDL = build_schema(schema.as_str())

SDL_DEFAULT_BUG = pytest.mark.xfail(
    strict=True, raises=AssertionError,
    reason='BUG: trailing commas in annotation_model.py publish a default of [""] for this filter')


def fields_of(type_name):
    return {name: str(field.type) for name, field in SDL.type_map[type_name].fields.items()}


class TestQueryType:

    def test_fields(self):
        assert set(SDL.query_type.fields) == {
            "annotation", "annotations", "annotationsCount", "annotationsExport",
            "genes", "genesCount", "geneStats", "termStats",
            "autocomplete", "slimTermsAutocomplete",
        }

    def test_read_only(self):
        assert SDL.mutation_type is None
        assert SDL.subscription_type is None

    @pytest.mark.parametrize("field, returns, arguments", [
        ("annotation", "Annotation!", {"id": "String!"}),
        ("annotations", "[Annotation!]!", {"filterArgs": "AnnotationFilterArgs", "pageArgs": "PageArgs"}),
        ("annotationsCount", "ResultCount!", {"filterArgs": "AnnotationFilterArgs"}),
        ("annotationsExport", "AnnotationExport!", {"filterArgs": "AnnotationFilterArgs", "pageArgs": "PageArgs"}),
        ("genes", "[Gene!]!", {"filterArgs": "GeneFilterArgs", "pageArgs": "PageArgs"}),
        ("genesCount", "ResultCount!", {"filterArgs": "GeneFilterArgs"}),
        ("geneStats", "GeneStats!", {"filterArgs": "GeneFilterArgs"}),
        ("termStats", "TermStats!", {"filterArgs": "GeneFilterArgs"}),
        ("autocomplete", "[Gene!]!",
         {"autocompleteType": "AutocompleteType!", "keyword": "String!", "filterArgs": "GeneFilterArgs"}),
        ("slimTermsAutocomplete", "[Term!]!", {"keyword": "String!", "filterArgs": "AnnotationFilterArgs"}),
    ])
    def test_signature(self, field, returns, arguments):
        query_field = SDL.query_type.fields[field]
        assert str(query_field.type) == returns
        assert {name: str(arg.type) for name, arg in query_field.args.items()} == arguments


class TestInputTypes:

    def test_annotation_filter_args(self):
        assert fields_of("AnnotationFilterArgs") == {name: "[String!]" for name in (
            "termIds", "termTypeIds", "slimTermIds", "evidenceTypeIds",
            "geneIds", "aspectIds", "withGeneIds", "referenceIds")}

    def test_gene_filter_args(self):
        assert fields_of("GeneFilterArgs") == {name: "[String!]" for name in ("slimTermIds", "termIds", "geneIds")}

    def test_page_args(self):
        page_args = SDL.type_map["PageArgs"].fields
        assert fields_of("PageArgs") == {"page": "Int", "size": "Int"}
        assert (page_args["page"].default_value, page_args["size"].default_value) == (0, 50)

    @pytest.mark.parametrize("input_type, field", [
        ("AnnotationFilterArgs", "termIds"),
        ("AnnotationFilterArgs", "termTypeIds"),
        ("AnnotationFilterArgs", "slimTermIds"),
        ("AnnotationFilterArgs", "evidenceTypeIds"),
        ("AnnotationFilterArgs", "referenceIds"),
        pytest.param("AnnotationFilterArgs", "geneIds", marks=SDL_DEFAULT_BUG),
        pytest.param("AnnotationFilterArgs", "aspectIds", marks=SDL_DEFAULT_BUG),
        pytest.param("AnnotationFilterArgs", "withGeneIds", marks=SDL_DEFAULT_BUG),
        ("GeneFilterArgs", "slimTermIds"),
        ("GeneFilterArgs", "termIds"),
        pytest.param("GeneFilterArgs", "geneIds", marks=SDL_DEFAULT_BUG),
    ])
    def test_filters_publish_no_default(self, input_type, field):
        # A client copying the advertised default ([""]) would filter on an empty id and match nothing.
        assert SDL.type_map[input_type].fields[field].default_value is Undefined


class TestOutputTypes:

    def test_autocomplete_type_values_are_lowercase(self):
        assert set(SDL.type_map["AutocompleteType"].values) == {"gene", "slim_term"}

    @pytest.mark.parametrize("type_name, fields", [
        ("Annotation", {
            "id": "String", "gene": "String!", "geneSymbol": "String", "geneName": "String",
            "namedGene": "Boolean", "longId": "String", "pantherFamily": "String",
            "taxonAbbr": "String", "taxonLabel": "String", "taxonId": "String",
            "coordinatesChrNum": "String", "coordinatesStart": "Int", "coordinatesEnd": "Int",
            "coordinatesStrand": "Int", "termType": "String", "term": "Term", "slimTerms": "[Term!]!",
            "evidenceType": "String", "evidence": "[Evidence!]!", "groups": "[String!]!", "evidenceCount": "Int",
        }),
        ("Gene", {
            "gene": "String!", "geneSymbol": "String", "geneName": "String", "namedGene": "Boolean",
            "longId": "String", "pantherFamily": "String", "taxonAbbr": "String", "taxonLabel": "String",
            "taxonId": "String", "coordinatesChrNum": "String", "coordinatesStart": "Int",
            "coordinatesEnd": "Int", "coordinatesStrand": "Int", "terms": "[Term!]!",
            "slimTerms": "[Term!]!", "termCount": "Int",
        }),
        ("Term", {
            "id": "String!", "label": "String", "displayId": "String", "aspect": "String",
            "isGoslim": "Boolean", "count": "Int", "evidenceType": "String", "parentIds": "[String!]",
        }),
        ("Evidence", {"withGeneId": "Gene!", "references": "[Reference!]!"}),
        ("Reference", {"pmid": "String!", "title": "String!", "authors": "[String!]!", "date": "String!"}),
        ("ResultCount", {"total": "Int!"}),
        ("AnnotationExport", {"data": "String!"}),
        ("GeneStats", {"slimTermFrequency": "Frequency!"}),
        ("TermStats", {"termFrequency": "Frequency!"}),
        ("Frequency", {"buckets": "[Bucket!]!"}),
        ("Bucket", {"key": "String!", "docCount": "Int!", "meta": "Entity"}),
        ("Entity", {"id": "String!", "label": "String!", "aspect": "String!", "displayId": "String!",
                    "parentIds": "[String!]"}),
    ])
    def test_fields(self, type_name, fields):
        assert fields_of(type_name) == fields
