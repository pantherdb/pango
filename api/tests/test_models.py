"""Strawberry types built from Elasticsearch documents, and the defaults of the input types."""
import pytest
import strawberry

from src.models.annotation_model import Annotation, AnnotationFilterArgs, AnnotationMinimal, GeneFilterArgs
from src.models.base_model import PageArgs, Reference
from src.models.evidence_model import Evidence
from src.models.gene_model import Gene
from src.models.term_model import Term
from tests.factories import annotation_doc, evidence, evidence_gene, gene_doc, reference, term

TRAILING_COMMA_BUG = pytest.mark.xfail(
    strict=True, raises=AssertionError,
    reason="BUG: a trailing comma in annotation_model.py makes the default the tuple (UNSET,)")


class TestTerm:

    def test_defaults(self):
        t = Term(id="GO:0006914")
        assert (t.label, t.display_id, t.aspect, t.is_goslim, t.count, t.evidence_type, t.parent_ids) == \
            ("", "", "", False, 0, None, None)

    def test_unknown_document_keys_are_rejected(self):
        # Term has no custom __init__, so a new key in the loader's output breaks every resolver
        # that builds terms. test_loader_contract.py checks the loader's current keys.
        with pytest.raises(TypeError):
            Term(id="GO:0006914", new_loader_field=1)


class TestAnnotation:

    def test_nested_documents_become_types(self):
        a = Annotation(id="a1", **annotation_doc())
        assert isinstance(a.term, Term)
        assert all(isinstance(t, Term) for t in a.slim_terms)
        assert all(isinstance(e, Evidence) for e in a.evidence)

    def test_scalar_fields_are_copied(self):
        a = Annotation(id="a1", **annotation_doc())
        assert (a.id, a.gene, a.gene_symbol, a.term_type, a.evidence_type, a.groups, a.evidence_count) == \
            ("a1", "UniProtKB:Q9UNH6", "SNX7", "known", "homology", ["PomBase"], 1)

    @pytest.mark.parametrize("term_id, display_id", [
        ("GO:0000422", "GO:0000422"),
        ("UNKNOWN:0001", ""),
        ("go:0000422", ""),  # the prefix check is case-sensitive
    ])
    def test_display_id_is_the_go_id_or_empty(self, term_id, display_id):
        a = Annotation(**annotation_doc(term=term(term_id), slim_terms=[term(term_id)]))
        assert a.term.display_id == display_id
        assert a.slim_terms[0].display_id == display_id

    def test_display_id_is_always_recomputed(self):
        a = Annotation(**annotation_doc(term=term("UNKNOWN:0001", display_id="GO:0000422")))
        assert a.term.display_id == ""

    def test_id_defaults_to_empty_string(self):
        assert Annotation(**annotation_doc()).id == ""

    def test_absent_optional_fields_fall_back_to_defaults(self):
        doc = annotation_doc()
        for key in ("named_gene", "long_id", "panther_family", "coordinates_chr_num"):
            del doc[key]
        a = Annotation(**doc)
        assert (a.named_gene, a.long_id, a.panther_family, a.coordinates_chr_num) == (None, None, None, None)

    def test_fields_outside_the_type_are_tolerated(self):
        # The loader also writes "aspect" and "group", which the GraphQL type doesn't expose.
        a = Annotation(**annotation_doc(group="GO_Central"))
        assert a.group == "GO_Central"


class TestEvidence:

    def test_with_gene_id_becomes_a_gene(self):
        e = Evidence(**evidence(with_gene=evidence_gene("SGD:S000003573", "SNX4")))
        assert isinstance(e.with_gene_id, Gene)
        assert (e.with_gene_id.gene, e.with_gene_id.gene_symbol) == ("SGD:S000003573", "SNX4")

    def test_references_become_reference_types(self):
        e = Evidence(**evidence(references=[reference("PMID:1"), reference("PMID:2")]))
        assert all(isinstance(r, Reference) for r in e.references)
        assert [r.pmid for r in e.references] == ["PMID:1", "PMID:2"]

    def test_null_references_are_dropped(self):
        e = Evidence(**evidence(references=[None, reference("PMID:1"), None]))
        assert [r.pmid for r in e.references] == ["PMID:1"]

    def test_groups_are_kept(self):
        assert Evidence(**evidence(groups=["SGD", "PomBase"])).groups == ["SGD", "PomBase"]

    def test_reference_requires_every_field(self):
        incomplete = reference()
        del incomplete["title"]
        with pytest.raises(TypeError):
            Evidence(**evidence(references=[incomplete]))


class TestGene:

    def test_terms_and_slim_terms_get_display_ids(self):
        g = Gene(id="g1", **gene_doc())
        assert [(t.id, t.display_id) for t in g.terms] == [("GO:0000422", "GO:0000422"), ("UNKNOWN:0001", "")]
        assert [(t.id, t.display_id) for t in g.slim_terms] == [("GO:0006914", "GO:0006914"), ("UNKNOWN:0001", "")]

    def test_term_details_are_kept(self):
        g = Gene(**gene_doc())
        assert (g.terms[0].evidence_type, g.terms[0].parent_ids) == ("homology", ["GO:0006914"])

    def test_fields_outside_the_type_are_tolerated(self):
        assert Gene(id="g1", **gene_doc()).sort_priority == 1


class TestAnnotationMinimal:

    def test_flattens_the_term(self):
        m = AnnotationMinimal(gene="UniProtKB:Q9UNH6", gene_symbol="SNX7",
                              term={"id": "GO:0000422", "label": "autophagy of mitochondrion"})
        # vars() is exactly what annotationsExport serialises
        assert vars(m) == {"gene": "UniProtKB:Q9UNH6", "gene_symbol": "SNX7",
                           "term_id": "GO:0000422", "term_label": "autophagy of mitochondrion"}


class TestInputDefaults:

    def test_page_args(self):
        assert (PageArgs().page, PageArgs().size) == (0, 50)

    @pytest.mark.parametrize("field", [
        "term_ids",
        "term_type_ids",
        "slim_term_ids",
        "evidence_type_ids",
        "reference_ids",
        pytest.param("gene_ids", marks=TRAILING_COMMA_BUG),
        pytest.param("aspect_ids", marks=TRAILING_COMMA_BUG),
        pytest.param("with_gene_ids", marks=TRAILING_COMMA_BUG),
    ])
    def test_annotation_filters_default_to_unset(self, field):
        assert getattr(AnnotationFilterArgs(), field) is strawberry.UNSET

    @pytest.mark.parametrize("field", [
        "term_ids",
        "slim_term_ids",
        pytest.param("gene_ids", marks=TRAILING_COMMA_BUG),
    ])
    def test_gene_filters_default_to_unset(self, field):
        assert getattr(GeneFilterArgs(), field) is strawberry.UNSET
