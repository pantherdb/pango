"""genes, genesCount and gene autocomplete against Elasticsearch."""
import pytest

from tests.helpers import EVERY_GENE_FIELD
from tests.integration.oracle import matching_genes, sorted_genes

pytestmark = pytest.mark.integration

SNX7 = "UniProtKB:Q9UNH6"
DUSP27 = "UniProtKB:Q5VZP5"
GENES = "query($f: GeneFilterArgs, $p: PageArgs) { genes(filterArgs: $f, pageArgs: $p) { gene geneSymbol } }"
COUNT = "query($f: GeneFilterArgs) { genesCount(filterArgs: $f) { total } }"
AUTOCOMPLETE = "query($k: String!) { autocomplete(autocompleteType: gene, keyword: $k) { gene geneSymbol } }"

FILTERS = [
    pytest.param({}, id="none"),
    pytest.param({"termIds": ["GO:0000422"]}, id="term"),
    pytest.param({"termIds": ["UNKNOWN:0001"]}, id="shared-term"),
    pytest.param({"termIds": ["GO:0000422", "GO:0005769"]}, id="terms-on-one-gene"),
    # SNX7 has only the first: a gene needs every listed term
    pytest.param({"termIds": ["UNKNOWN:0001", "UNKNOWN:0003"]}, id="terms-all-required"),
    pytest.param({"slimTermIds": ["GO:0005737"]}, id="slim-term"),
    pytest.param({"slimTermIds": ["GO:0006914", "GO:0007005"]}, id="slim-terms-all-required"),
    pytest.param({"geneIds": [SNX7, DUSP27]}, id="genes-any"),
    pytest.param({"termIds": ["UNKNOWN:0001"], "geneIds": [SNX7]}, id="term-and-gene"),
]


def ids(genes):
    return sorted(g["gene"] for g in genes)


@pytest.mark.parametrize("filters", FILTERS)
def test_genes_match_the_oracle(live, loader_genes, filters):
    expected = matching_genes(loader_genes, filters)
    assert expected, "the fixture no longer exercises this filter"
    assert ids(live.data(GENES, {"f": filters, "p": {"size": 100}})["genes"]) == ids(expected)


@pytest.mark.parametrize("filters", FILTERS)
def test_count_matches_the_oracle(live, loader_genes, filters):
    assert live.data(COUNT, {"f": filters})["genesCount"]["total"] == len(matching_genes(loader_genes, filters))


def test_terms_on_different_genes_match_nothing(live, loader_genes):
    filters = {"termIds": ["GO:0000422", "GO:0008138"]}  # SNX7's and DUSP27's
    assert not matching_genes(loader_genes, filters)
    assert live.data(GENES, {"f": filters})["genes"] == []
    assert live.data(COUNT, {"f": filters})["genesCount"]["total"] == 0


def test_without_filter_args_every_gene_is_returned(live, loader_genes):
    # get_genes_query(None) sends no query at all, which Elasticsearch treats as match_all
    assert ids(live.data("{ genes(pageArgs: {size: 100}) { gene } }")["genes"]) == ids(loader_genes)
    assert live.data("{ genesCount { total } }")["genesCount"]["total"] == len(loader_genes)


def test_pages_hold_the_genes_in_sort_order(live, loader_genes):
    expected = [g["gene"] for g in sorted_genes(loader_genes)]
    for page in range(0, len(expected), 2):
        served = live.data(GENES, {"p": {"page": page // 2, "size": 2}})["genes"]
        # which genes land on each page follows the sort (their order within it doesn't, see below)
        assert ids(served) == sorted(expected[page:page + 2])


@pytest.mark.xfail(strict=True, raises=AssertionError,
                   reason="BUG: the second (ids) lookup returns genes in index order, not sort_priority/gene_symbol")
def test_genes_are_sorted_by_priority_then_symbol(live, loader_genes):
    served = live.data(GENES, {"p": {"size": 100}})["genes"]
    assert [g["gene"] for g in served] == [g["gene"] for g in sorted_genes(loader_genes)]


def test_every_document_serialises(live, loader_genes):
    genes = live.data(f"{{ genes(pageArgs: {{size: 100}}) {{ {EVERY_GENE_FIELD} }} }}")["genes"]
    assert ids(genes) == ids(loader_genes)
    by_gene = {g["gene"]: g for g in loader_genes}
    for gene in genes:
        assert gene["termCount"] == by_gene[gene["gene"]]["term_count"]
        assert [t["id"] for t in gene["terms"]] == [t["id"] for t in by_gene[gene["gene"]]["terms"]]


FULL_ID_NOT_MATCHED = pytest.mark.xfail(
    strict=True, raises=AssertionError,
    reason="BUG: the standard search analyzer keeps 'UniProtKB:Q9UNH6' as one token (a colon between "
           "letters doesn't split words) while the ngram index analyzer splits on ':', so full ids never match")


class TestGeneAutocomplete:

    @pytest.mark.parametrize("keyword", [
        pytest.param("SNX7", id="symbol"),
        pytest.param("snx", id="symbol-prefix-lowercase"),
        pytest.param("Q9UNH6", id="accession"),
        pytest.param("UniProtKB:Q9UNH6", id="gene-id", marks=FULL_ID_NOT_MATCHED),
        pytest.param("Sorting nexin", id="name"),
    ])
    def test_finds_a_gene_by_symbol_id_or_name(self, live, keyword):
        suggestions = live.data(AUTOCOMPLETE, {"k": keyword})["autocomplete"]
        assert [s["gene"] for s in suggestions[:1]] == [SNX7]

    def test_each_gene_is_suggested_once(self, live, loader_genes):
        suggestions = live.data(AUTOCOMPLETE, {"k": "UniProtKB"})["autocomplete"]
        assert ids(suggestions) == ids(loader_genes)

    def test_unknown_keyword(self, live):
        assert live.data(AUTOCOMPLETE, {"k": "zzzzzz"})["autocomplete"] == []
