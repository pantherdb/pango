"""Helpers in src/utils.py."""
from types import SimpleNamespace

import pytest
import strawberry

from src.utils import convert_camel_case, get_selected_fields, is_valid_filter


class TestIsValidFilter:

    @pytest.mark.parametrize("value", [
        strawberry.UNSET,
        None,
        [],
        (),
        [None],
        [strawberry.UNSET],
        # the default left behind by trailing commas in annotation_model.py
        (strawberry.UNSET,),
    ], ids=["UNSET", "None", "empty-list", "empty-tuple", "list-of-None", "list-of-UNSET", "tuple-of-UNSET"])
    def test_nothing_to_filter_on(self, value):
        assert is_valid_filter(value) is False

    @pytest.mark.parametrize("value", [
        ["GO:0006914"],
        ("GO:0006914",),
        [None, "GO:0006914"],
        ["GO:0006914", "GO:0007005"],
    ])
    def test_at_least_one_value(self, value):
        assert is_valid_filter(value) is True


class TestConvertCamelCase:

    @pytest.mark.parametrize("name, expected", [
        ("gene", "gene"),
        ("geneSymbol", "gene_symbol"),
        ("slimTermIds", "slim_term_ids"),
        ("coordinatesChrNum", "coordinates_chr_num"),
        ("GeneSymbol", "gene_symbol"),
    ])
    def test_converts_to_snake_case(self, name, expected):
        assert convert_camel_case(name) == expected


class TestGetSelectedFields:

    def test_snake_case_names_of_the_top_level_selection(self):
        selections = [SimpleNamespace(name=name) for name in ("gene", "geneSymbol", "termCount")]
        info = SimpleNamespace(selected_fields=[SimpleNamespace(selections=selections)])
        assert get_selected_fields(info) == ["gene", "gene_symbol", "term_count"]
