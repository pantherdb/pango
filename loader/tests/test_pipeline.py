"""Integration tests that run the data processing pipeline on test_data/input
and compare results against the expected output in test_data/output.

This replicates what scripts/all.sh does (minus get_articles and index_es):
  1. clean_annotations: input annotations → enriched annotations
  2. generate_gene_annotations: clean annotations → gene-level aggregations
"""
import json

import pytest

from src.clean_annotations import (
    get_annos as clean_annos,
    get_terms_map,
    get_articles_map,
    get_taxon_map,
    get_genes_map,
)
from src.generate_gene_annotations import (
    get_annos as generate_genes,
    load_parent_lookup,
)


def normalize(obj):
    """Recursively sort lists of primitives for stable comparison.

    The 'groups' field is derived from a set, so its order is non-deterministic.
    This normalizes both sides so comparisons are stable.
    """
    if isinstance(obj, dict):
        return {k: normalize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        if obj and isinstance(obj[0], dict):
            return [normalize(item) for item in obj]
        if obj and isinstance(obj[0], str):
            return sorted(obj)
        return obj
    return obj


def run_clean_annotations(annos_fp, terms_fp, articles_fp, taxon_fp, genes_fp):
    """Replicate clean_annotations.main() without file I/O."""
    terms_df = get_terms_map(terms_fp)
    articles_df = get_articles_map(articles_fp)
    taxon_df = get_taxon_map(taxon_fp)
    genes_df = get_genes_map(genes_fp, taxon_df)
    annos_df = clean_annos(annos_fp, terms_df, genes_df, articles_df)
    return json.loads(annos_df.to_json(orient="records", default_handler=None))


def run_generate_genes(clean_annos_fp, hierarchy_fp):
    """Replicate generate_gene_annotations.main() without file I/O."""
    load_parent_lookup(hierarchy_fp)
    genes_df = generate_genes(clean_annos_fp)
    return json.loads(genes_df.to_json(orient="records", default_handler=None))


# ---------------------------------------------------------------------------
# Step 1: clean_annotations
# ---------------------------------------------------------------------------

class TestCleanAnnotationsPipeline:

    def test_record_count(self, annos_fp, terms_fp, articles_fp, taxon_fp, genes_fp, clean_annos_fp):
        actual = run_clean_annotations(annos_fp, terms_fp, articles_fp, taxon_fp, genes_fp)
        with open(clean_annos_fp, encoding='utf-8') as f:
            expected = json.load(f)
        assert len(actual) == len(expected)

    def test_all_genes_present(self, annos_fp, terms_fp, articles_fp, taxon_fp, genes_fp, clean_annos_fp):
        actual = run_clean_annotations(annos_fp, terms_fp, articles_fp, taxon_fp, genes_fp)
        with open(clean_annos_fp, encoding='utf-8') as f:
            expected = json.load(f)
        assert sorted(set(r['gene'] for r in actual)) == sorted(set(r['gene'] for r in expected))

    def test_evidence_counts_match(self, annos_fp, terms_fp, articles_fp, taxon_fp, genes_fp, clean_annos_fp):
        actual = run_clean_annotations(annos_fp, terms_fp, articles_fp, taxon_fp, genes_fp)
        with open(clean_annos_fp, encoding='utf-8') as f:
            expected = json.load(f)

        actual_map = {(r['gene'], r['term']['id']): r for r in actual}
        expected_map = {(r['gene'], r['term']['id']): r for r in expected}

        for key, exp in expected_map.items():
            assert key in actual_map, f"Missing annotation: {key}"
            assert actual_map[key]['evidence_count'] == exp['evidence_count'], (
                f"evidence_count mismatch for {key}"
            )

    def test_output_matches_expected(self, annos_fp, terms_fp, articles_fp, taxon_fp, genes_fp, clean_annos_fp):
        actual = run_clean_annotations(annos_fp, terms_fp, articles_fp, taxon_fp, genes_fp)
        with open(clean_annos_fp, encoding='utf-8') as f:
            expected = json.load(f)

        key = lambda r: (r['gene'], r['term']['id'])
        actual_sorted = sorted(actual, key=key)
        expected_sorted = sorted(expected, key=key)

        for act, exp in zip(actual_sorted, expected_sorted):
            assert normalize(act) == normalize(exp), (
                f"Mismatch for gene={exp['gene']}, term={exp['term']['id']}"
            )


# ---------------------------------------------------------------------------
# Step 2: generate_gene_annotations
# ---------------------------------------------------------------------------

class TestGenerateGenesPipeline:

    def test_record_count(self, clean_annos_fp, hierarchy_fp, clean_genes_fp):
        actual = run_generate_genes(clean_annos_fp, hierarchy_fp)
        with open(clean_genes_fp, encoding='utf-8') as f:
            expected = json.load(f)
        assert len(actual) == len(expected)

    def test_term_counts(self, clean_annos_fp, hierarchy_fp, clean_genes_fp):
        actual = run_generate_genes(clean_annos_fp, hierarchy_fp)
        with open(clean_genes_fp, encoding='utf-8') as f:
            expected = json.load(f)

        actual_map = {r['gene']: r for r in actual}
        expected_map = {r['gene']: r for r in expected}

        for gene, exp in expected_map.items():
            assert gene in actual_map
            assert actual_map[gene]['term_count'] == exp['term_count'], (
                f"term_count mismatch for {gene}"
            )

    def test_sort_priority(self, clean_annos_fp, hierarchy_fp, clean_genes_fp):
        actual = run_generate_genes(clean_annos_fp, hierarchy_fp)
        with open(clean_genes_fp, encoding='utf-8') as f:
            expected = json.load(f)

        actual_map = {r['gene']: r for r in actual}
        expected_map = {r['gene']: r for r in expected}

        for gene, exp in expected_map.items():
            assert actual_map[gene]['sort_priority'] == exp['sort_priority'], (
                f"sort_priority mismatch for {gene}"
            )

    def test_output_order(self, clean_annos_fp, hierarchy_fp, clean_genes_fp):
        """Output should be sorted by sort_priority asc, term_count desc."""
        actual = run_generate_genes(clean_annos_fp, hierarchy_fp)
        with open(clean_genes_fp, encoding='utf-8') as f:
            expected = json.load(f)

        actual_order = [(r['gene'], r['sort_priority'], r['term_count']) for r in actual]
        expected_order = [(r['gene'], r['sort_priority'], r['term_count']) for r in expected]
        assert actual_order == expected_order

    def test_output_matches_expected(self, clean_annos_fp, hierarchy_fp, clean_genes_fp):
        actual = run_generate_genes(clean_annos_fp, hierarchy_fp)
        with open(clean_genes_fp, encoding='utf-8') as f:
            expected = json.load(f)

        actual_sorted = sorted(actual, key=lambda r: r['gene'])
        expected_sorted = sorted(expected, key=lambda r: r['gene'])

        for act, exp in zip(actual_sorted, expected_sorted):
            assert normalize(act) == normalize(exp), (
                f"Mismatch for gene={exp['gene']}"
            )


# ---------------------------------------------------------------------------
# Full pipeline: input → clean_annotations → generate_genes
# ---------------------------------------------------------------------------

class TestFullPipeline:

    def test_end_to_end(self, tmp_path, annos_fp, terms_fp, articles_fp,
                        taxon_fp, genes_fp, hierarchy_fp, clean_genes_fp):
        """Chain both pipeline steps and verify the final gene output."""
        # Step 1: clean annotations
        clean_result = run_clean_annotations(
            annos_fp, terms_fp, articles_fp, taxon_fp, genes_fp
        )

        # Write intermediate result to tmp file (same as main() does)
        intermediate_fp = str(tmp_path / 'clean_annotations.json')
        with open(intermediate_fp, 'w', encoding='utf-8') as f:
            json.dump(clean_result, f, ensure_ascii=False)

        # Step 2: generate genes from intermediate
        actual = run_generate_genes(intermediate_fp, hierarchy_fp)

        with open(clean_genes_fp, encoding='utf-8') as f:
            expected = json.load(f)

        actual_sorted = sorted(actual, key=lambda r: r['gene'])
        expected_sorted = sorted(expected, key=lambda r: r['gene'])

        for act, exp in zip(actual_sorted, expected_sorted):
            assert normalize(act) == normalize(exp), (
                f"End-to-end mismatch for gene={exp['gene']}"
            )
