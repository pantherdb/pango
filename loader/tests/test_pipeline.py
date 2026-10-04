"""Golden-file tests: run the pipeline on test_data/input through the same CLI
entry points scripts/all.sh uses, and compare with test_data/output.

  1. clean_annotations: input annotations → enriched annotations
  2. generate_gene_annotations: clean annotations → gene-level aggregations

get_articles (network) and index_es (Elasticsearch) are covered by their own
tests. To regenerate the expected files after an intended output change, see
tests/README.md.
"""
import json

import pytest

from src import clean_annotations, generate_gene_annotations


def read_json(fp):
    with open(fp, encoding='utf-8') as f:
        return json.load(f)


def anno_key(record):
    return record['gene'], record['term']['id']


def canonical(annotation):
    """Annotation-level 'groups' is built from a set, so its order varies between runs."""
    return {**annotation, 'groups': sorted(annotation['groups'])}


def assert_same_genes(actual, expected):
    assert [g['gene'] for g in actual] == [g['gene'] for g in expected]
    for act, exp in zip(actual, expected):
        assert act == exp, f"Mismatch for gene={exp['gene']}"


@pytest.fixture(scope='module')
def workdir(tmp_path_factory):
    return tmp_path_factory.mktemp('pipeline')


@pytest.fixture(scope='module')
def clean_actual_fp(workdir, run_main, annos_fp, terms_fp, articles_fp, taxon_fp, genes_fp):
    out = workdir / 'human_iba_annotations_clean.json'
    run_main(clean_annotations, '-a', annos_fp, '-t', terms_fp, '-art', articles_fp,
             '-tax', taxon_fp, '-g', genes_fp, '-o', out)
    return out


@pytest.fixture(scope='module')
def clean_actual(clean_actual_fp):
    return read_json(clean_actual_fp)


@pytest.fixture(scope='module')
def clean_expected(clean_annos_fp):
    return read_json(clean_annos_fp)


@pytest.fixture(scope='module')
def genes_actual(workdir, run_main, clean_annos_fp, hierarchy_fp):
    """Step 2 alone, fed the expected step-1 output."""
    out = workdir / 'genes_from_expected_clean.json'
    run_main(generate_gene_annotations, '-a', clean_annos_fp, '-o', out, '-hi', hierarchy_fp)
    return read_json(out)


@pytest.fixture(scope='module')
def genes_chained(workdir, run_main, clean_actual_fp, hierarchy_fp):
    """Step 2 fed the step-1 output produced in this run, as in all.sh."""
    out = workdir / 'human_iba_genes_clean.json'
    run_main(generate_gene_annotations, '-a', clean_actual_fp, '-o', out, '-hi', hierarchy_fp)
    return read_json(out)


@pytest.fixture(scope='module')
def genes_expected(clean_genes_fp):
    return read_json(clean_genes_fp)


# ---------------------------------------------------------------------------
# Step 1: clean_annotations
# ---------------------------------------------------------------------------

class TestCleanAnnotationsPipeline:

    def test_record_count(self, clean_actual, clean_expected):
        assert len(clean_actual) == len(clean_expected)

    def test_all_genes_present(self, clean_actual, clean_expected):
        assert sorted(set(r['gene'] for r in clean_actual)) == sorted(set(r['gene'] for r in clean_expected))

    def test_evidence_counts_match(self, clean_actual, clean_expected):
        actual_map = {anno_key(r): r for r in clean_actual}

        for exp in clean_expected:
            key = anno_key(exp)
            assert key in actual_map, f"Missing annotation: {key}"
            assert actual_map[key]['evidence_count'] == exp['evidence_count'], (
                f"evidence_count mismatch for {key}"
            )

    def test_output_matches_expected(self, clean_actual, clean_expected):
        actual = {anno_key(r): canonical(r) for r in clean_actual}
        expected = {anno_key(r): canonical(r) for r in clean_expected}

        assert actual.keys() == expected.keys()
        for key, exp in expected.items():
            assert actual[key] == exp, f"Mismatch for gene={key[0]}, term={key[1]}"


# ---------------------------------------------------------------------------
# Step 2: generate_gene_annotations
# ---------------------------------------------------------------------------

class TestGenerateGenesPipeline:

    def test_record_count(self, genes_actual, genes_expected):
        assert len(genes_actual) == len(genes_expected)

    def test_term_counts(self, genes_actual, genes_expected):
        actual_map = {r['gene']: r for r in genes_actual}

        for exp in genes_expected:
            assert exp['gene'] in actual_map
            assert actual_map[exp['gene']]['term_count'] == exp['term_count'], (
                f"term_count mismatch for {exp['gene']}"
            )

    def test_sort_priority(self, genes_actual, genes_expected):
        actual_map = {r['gene']: r for r in genes_actual}

        for exp in genes_expected:
            assert actual_map[exp['gene']]['sort_priority'] == exp['sort_priority'], (
                f"sort_priority mismatch for {exp['gene']}"
            )

    def test_output_order(self, genes_actual, genes_expected):
        """Output should be sorted by sort_priority asc, term_count desc."""
        actual_order = [(r['gene'], r['sort_priority'], r['term_count']) for r in genes_actual]
        expected_order = [(r['gene'], r['sort_priority'], r['term_count']) for r in genes_expected]
        assert actual_order == expected_order

    def test_output_matches_expected(self, genes_actual, genes_expected):
        assert_same_genes(genes_actual, genes_expected)


# ---------------------------------------------------------------------------
# Full pipeline: input → clean_annotations → generate_gene_annotations
# ---------------------------------------------------------------------------

class TestFullPipeline:

    def test_end_to_end(self, genes_chained, genes_expected):
        assert_same_genes(genes_chained, genes_expected)
