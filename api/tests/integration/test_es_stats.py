"""geneStats and termStats aggregations against Elasticsearch."""
import pytest

from tests.integration.oracle import genes_per_slim_term, matching_genes, term_stats

pytestmark = pytest.mark.integration

SNX7 = "UniProtKB:Q9UNH6"
GENE_STATS = ("query($f: GeneFilterArgs) { geneStats(filterArgs: $f) "
              "{ slimTermFrequency { buckets { key docCount meta { id label aspect displayId } } } } }")
TERM_STATS = ("query($f: GeneFilterArgs) { termStats(filterArgs: $f) "
              "{ termFrequency { buckets { key docCount meta { id label aspect displayId parentIds } } } } }")
GENES_COUNT = "query($f: GeneFilterArgs) { genesCount(filterArgs: $f) { total } }"


def gene_stats(live, filters=None):
    return live.data(GENE_STATS, {"f": filters})["geneStats"]["slimTermFrequency"]["buckets"]


def term_stats_buckets(live, filters=None):
    return live.data(TERM_STATS, {"f": filters})["termStats"]["termFrequency"]["buckets"]


def counts(buckets):
    return {b["key"]: b["docCount"] for b in buckets}


def display_id(term_id):
    return term_id if term_id.startswith("GO") else ""


class TestGeneStats:

    @pytest.mark.parametrize("filters", [
        pytest.param({}, id="none"),
        pytest.param({"slimTermIds": ["GO:0005737"]}, id="slim-term"),
        pytest.param({"termIds": ["UNKNOWN:0001"]}, id="term"),
        pytest.param({"geneIds": [SNX7]}, id="gene"),
    ])
    def test_genes_per_slim_term(self, live, loader_genes, filters):
        assert counts(gene_stats(live, filters)) == genes_per_slim_term(matching_genes(loader_genes, filters))

    def test_meta_describes_each_slim_term(self, live, loader_genes):
        slim_terms = {s["id"]: s for g in loader_genes for s in g["slim_terms"]}
        for bucket in gene_stats(live):
            slim = slim_terms[bucket["key"]]
            assert bucket["meta"] == {"id": slim["id"], "label": slim["label"], "aspect": slim["aspect"],
                                      "displayId": display_id(slim["id"])}

    def test_counts_agree_with_genes_count(self, live):
        # selecting a slim-term bucket in the UI must list as many genes as the bucket shows
        for bucket in gene_stats(live):
            total = live.data(GENES_COUNT, {"f": {"slimTermIds": [bucket["key"]]}})["genesCount"]["total"]
            assert total == bucket["docCount"], bucket["key"]


class TestTermStats:

    @pytest.mark.parametrize("filters", [
        pytest.param({}, id="none"),
        pytest.param({"slimTermIds": ["GO:0005737"]}, id="slim-term"),
        pytest.param({"termIds": ["UNKNOWN:0001"]}, id="term-co-annotation"),
        pytest.param({"geneIds": [SNX7, "UniProtKB:Q5VZP5"]}, id="genes"),
        pytest.param({"termIds": ["UNKNOWN:0002"], "slimTermIds": ["UNKNOWN:0003"]}, id="term-and-slim-term"),
    ])
    def test_genes_per_term(self, live, loader_annotations, loader_genes, filters):
        expected = term_stats(loader_annotations, loader_genes, filters)
        assert expected, "the fixture no longer exercises this filter"
        assert counts(term_stats_buckets(live, filters)) == expected

    def test_meta_lists_the_slim_terms_as_parents(self, live, loader_annotations):
        slim_ids = {d["term"]["id"]: [s["id"] for s in d["slim_terms"]] for d in loader_annotations}
        labels = {d["term"]["id"]: (d["term"]["label"], d["term"]["aspect"]) for d in loader_annotations}
        for bucket in term_stats_buckets(live):
            term = bucket["key"]
            assert bucket["meta"] == {"id": term, "label": labels[term][0], "aspect": labels[term][1],
                                      "displayId": display_id(term), "parentIds": slim_ids[term]}

    def test_counts_agree_with_genes_count(self, live):
        # the genes index and the annotations index must agree on who carries each term
        for bucket in term_stats_buckets(live):
            total = live.data(GENES_COUNT, {"f": {"termIds": [bucket["key"]]}})["genesCount"]["total"]
            assert total == bucket["docCount"], bucket["key"]

    def test_unmatched_term_returns_no_buckets(self, live):
        assert term_stats_buckets(live, {"termIds": ["GO:9999999"]}) == []
