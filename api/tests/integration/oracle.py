"""Expected answers computed in plain Python from the loader's fixture documents.

Each function spells out the semantics the API promises, so results from Elasticsearch are checked
against an independent model rather than against hard-coded numbers. Filters use the GraphQL
argument names, e.g. ``{"termIds": [...], "geneIds": [...]}``.
"""
from collections import Counter


def slim_ids(doc):
    return {s["id"] for s in doc["slim_terms"]}


def matching_annotations(annotations, filters):
    """Any listed value matches (OR); different filters must all match (AND)."""
    def matches(doc):
        return all([
            not filters.get("termIds") or doc["term"]["id"] in filters["termIds"],
            not filters.get("termTypeIds") or doc["term_type"] in filters["termTypeIds"],
            not filters.get("slimTermIds") or bool(slim_ids(doc) & set(filters["slimTermIds"])),
            not filters.get("geneIds") or doc["gene"] in filters["geneIds"],
            not filters.get("aspectIds") or doc["term"]["aspect"] in filters["aspectIds"],
            not filters.get("evidenceTypeIds") or doc["evidence_type"] in filters["evidenceTypeIds"],
        ])
    return [doc for doc in annotations if matches(doc)]


def matching_genes(genes, filters):
    """A gene needs every listed term and slim term (AND), and any of the listed gene ids (OR)."""
    def matches(doc):
        return all([
            set(filters.get("termIds") or []) <= {t["id"] for t in doc["terms"]},
            set(filters.get("slimTermIds") or []) <= slim_ids(doc),
            not filters.get("geneIds") or doc["gene"] in filters["geneIds"],
        ])
    return [doc for doc in genes if matches(doc)]


def sorted_genes(genes):
    """The order ``genes`` requests: sort_priority, then gene symbol."""
    return sorted(genes, key=lambda g: (g["sort_priority"], g["gene_symbol"]))


def genes_per_slim_term(genes):
    """geneStats: how many genes carry each slim term."""
    return dict(Counter(slim for gene in genes for slim in slim_ids(gene)))


def genes_per_term(annotations):
    """termStats buckets: distinct genes annotated to each term."""
    genes = {}
    for doc in annotations:
        genes.setdefault(doc["term"]["id"], set()).add(doc["gene"])
    return {term: len(g) for term, g in genes.items()}


def term_stats(annotations, genes, filters):
    """termStats: termIds/geneIds first select genes (from the genes index), then every
    annotation of those genes is counted, restricted to the selected slim terms."""
    if filters.get("termIds") or filters.get("geneIds"):
        selected = {g["gene"] for g in matching_genes(genes, filters)}
        annotations = [a for a in annotations if a["gene"] in selected]
    return genes_per_term(matching_annotations(annotations, {"slimTermIds": filters.get("slimTermIds")}))
