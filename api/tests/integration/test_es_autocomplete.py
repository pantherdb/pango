"""Slim-term autocomplete against Elasticsearch with the loader's mappings."""
import pytest

pytestmark = pytest.mark.integration

SLIM_TERMS = "query($k: String!) { slimTermsAutocomplete(keyword: $k) { id label aspect count } }"
LABEL_NOT_INDEXED = pytest.mark.xfail(
    strict=True, raises=AssertionError,
    reason="BUG: slimTermsAutocomplete searches slim_terms.label and aggregates slim_terms.label.keyword, "
           "but since loader commit da7bf3b the label is 'index': false with no keyword subfield")


@LABEL_NOT_INDEXED
def test_finds_a_slim_term_by_label_prefix(live):
    terms = live.data(SLIM_TERMS, {"k": "autoph"})["slimTermsAutocomplete"]
    assert "GO:0006914" in [t["id"] for t in terms]


@LABEL_NOT_INDEXED
def test_accepts_multi_word_keywords(live):
    # currently ES 400: "field:[slim_terms.label] was indexed without position data"
    live.data(SLIM_TERMS, {"k": "mitochondrion organization"})


@LABEL_NOT_INDEXED
def test_finds_a_slim_term_by_id(live):
    terms = live.data(SLIM_TERMS, {"k": "GO:0006914"})["slimTermsAutocomplete"]
    assert [t["id"] for t in terms] == ["GO:0006914"]


@LABEL_NOT_INDEXED
def test_counts_genes_carrying_the_term(live, loader_genes):
    terms = live.data(SLIM_TERMS, {"k": "cytoplasm"})["slimTermsAutocomplete"]
    expected = sum(1 for g in loader_genes if "GO:0005737" in {s["id"] for s in g["slim_terms"]})
    assert {t["id"]: t["count"] for t in terms}.get("GO:0005737") == expected


@pytest.mark.xfail(
    strict=True, raises=AssertionError,
    reason="BUG: besides the label mapping, the nested aggregation isn't filtered by the keyword: with a "
           "searchable label, 'autoph' suggests all 9 slim terms of SNX7 (transport, cytoplasm, ...)")
def test_only_matching_slim_terms_are_suggested(live):
    terms = live.data(SLIM_TERMS, {"k": "autophagy"})["slimTermsAutocomplete"]
    assert terms
    assert all("autophagy" in t["label"].lower() for t in terms)


@pytest.mark.xfail(strict=True, raises=AssertionError,
                   reason="BUG: autocomplete(slim_term) collapses on the unmapped slim_term.id.keyword (ES 400)")
def test_autocomplete_slim_term_type(live):
    live.data('{ autocomplete(autocompleteType: slim_term, keyword: "autophagy") { gene } }')
