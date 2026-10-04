"""Builders for Elasticsearch documents and responses.

Documents mirror what the loader indexes (``loader/test_data/output``). Responses mirror what
Elasticsearch 8.5 returns for the exact requests the resolvers send (captured from a cluster loaded
with the loader's mappings), trimmed to the keys the API reads.
"""
from elastic_transport import ApiResponseMeta, HttpHeaders, NodeConfig

ANNOTATIONS_INDEX = "pango-1-pytest-annotations"
GENES_INDEX = "pango-1-pytest-genes"


# --- Documents ----------------------------------------------------------------------------------

def term(id="GO:0006914", label="autophagy", aspect="biological process", **extra):
    return {"id": id, "label": label, "aspect": aspect, **extra}


def reference(pmid="PMID:27737912", date=1479168000000,
              title="Atg20- and Atg24-family proteins promote organelle autophagy in fission yeast.",
              authors=("Zhao D", "Du LL")):
    # The loader stores dates as epoch milliseconds even though the schema type is String.
    return {"pmid": pmid, "title": title, "date": date, "authors": list(authors)}


def evidence_gene(gene="PomBase:SPAC6F6.12", gene_symbol="atg24", **extra):
    return {
        "gene": gene,
        "gene_symbol": gene_symbol,
        "gene_name": "Sorting nexin-4",
        "taxon_id": "284812",
        "taxon_label": "Schizosaccharomyces pombe",
        "taxon_abbr": "Spo",
        **extra,
    }


def evidence(with_gene=None, references=None, groups=("PomBase",)):
    return {
        "with_gene_id": with_gene or evidence_gene(),
        "references": [reference()] if references is None else references,
        "groups": list(groups),
    }


def annotation_doc(**overrides):
    """An annotations-index document as written by ``loader/src/clean_annotations.py``."""
    doc = {
        "gene": "UniProtKB:Q9UNH6",
        "gene_symbol": "SNX7",
        "gene_name": "Sorting nexin-7",
        "named_gene": True,
        "long_id": "HUMAN|HGNC=14971|UniProtKB=Q9UNH6",
        "panther_family": "PTHR45949",
        "taxon_id": "9606",
        "taxon_label": "Homo sapiens",
        "taxon_abbr": "Hsa",
        # pandas writes these as floats in annotation documents
        "coordinates_chr_num": 1.0,
        "coordinates_start": 98662223.0,
        "coordinates_end": 98760498.0,
        "term": term("GO:0000422", "autophagy of mitochondrion", is_goslim=False),
        "slim_terms": [term(is_goslim=True)],
        "term_type": "known",
        "evidence_type": "homology",
        "evidence": [evidence()],
        "groups": ["PomBase"],
        "evidence_count": 1,
        # written by the loader but not part of the GraphQL type
        "aspect": "biological process",
        "group": "GO_Central",
    }
    doc.update(overrides)
    return doc


def gene_doc(**overrides):
    """A genes-index document as written by ``loader/src/generate_gene_annotations.py``."""
    doc = {
        "gene": "UniProtKB:Q9UNH6",
        "gene_symbol": "SNX7",
        "gene_name": "Sorting nexin-7",
        "taxon_id": 9606,
        "taxon_label": "Homo sapiens",
        "taxon_abbr": "Hsa",
        "panther_family": "PTHR45949",
        "long_id": "HUMAN|HGNC=14971|UniProtKB=Q9UNH6",
        "coordinates_chr_num": 1,
        "coordinates_start": 98662223,
        "coordinates_end": 98760498,
        "named_gene": True,
        "sort_priority": 1,
        "term_count": 2,
        "terms": [
            term("GO:0000422", "autophagy of mitochondrion", evidence_type="homology", parent_ids=["GO:0006914"]),
            term("UNKNOWN:0001", "Unknown molecular function", "molecular function", evidence_type="n/a", parent_ids=[]),
        ],
        "slim_terms": [
            term(evidence_type="homology"),
            term("UNKNOWN:0001", "Unknown molecular function", "molecular function", evidence_type="n/a"),
        ],
    }
    doc.update(overrides)
    return doc


# --- Search, count and get responses -------------------------------------------------------------

def hit(source, id="doc-1", index=ANNOTATIONS_INDEX):
    return {"_index": index, "_id": id, "_score": 1.0, "_source": source}


def search_response(hits=(), aggregations=None):
    """A complete search response (request sent without ``filter_path``)."""
    hits = list(hits)
    response = {
        "took": 1,
        "timed_out": False,
        "hits": {"total": {"value": len(hits), "relation": "eq"}, "max_score": 1.0, "hits": hits},
    }
    if aggregations is not None:
        response["aggregations"] = aggregations
    return response


def filtered_search_response(hits=()):
    """A search response trimmed by the resolvers' ``filter_path``.

    Elasticsearch drops the ``hits`` key entirely when nothing matches.
    """
    hits = [{k: v for k, v in h.items() if k in ("_id", "_score", "_source")} for h in hits]
    return {"took": 1, "hits": {"hits": hits}} if hits else {"took": 1}


def count_response(count):
    return {"count": count, "_shards": {"total": 1, "successful": 1, "skipped": 0, "failed": 0}}


def get_response(source, id="doc-1", index=ANNOTATIONS_INDEX):
    return {"_index": index, "_id": id, "_version": 1, "found": True, "_source": source}


def api_error(error_cls, status, body):
    """An ``elasticsearch`` API error (e.g. ``NotFoundError``) as raised by the client."""
    meta = ApiResponseMeta(status=status, http_version="1.1", headers=HttpHeaders(), duration=0.0,
                           node=NodeConfig("http", "localhost", 9200))
    return error_cls(message=str(body), meta=meta, body=body)


# --- Aggregations ---------------------------------------------------------------------------------

def top_hits(*sources, nested_field=None):
    """A ``top_hits`` result; nested top hits carry the nested object itself as ``_source``."""
    hits = []
    for offset, source in enumerate(sources):
        h = {"_index": "idx", "_id": f"top-{offset}", "_score": 0.0, "_source": source}
        if nested_field:
            h["_nested"] = {"field": nested_field, "offset": offset}
        hits.append(h)
    return {"hits": {"total": {"value": len(hits), "relation": "eq"}, "max_score": 0.0, "hits": hits}}


def slim_term_bucket(id, label, aspect, genes, nested_docs=None):
    """A ``distinct_slim_term_frequency`` bucket produced by ``get_slim_terms_query()``."""
    return {
        "key": id,
        "doc_count": genes if nested_docs is None else nested_docs,
        "docs": top_hits({"aspect": aspect, "id": id, "label": label}, nested_field="slim_terms"),
        "distinct_genes": {"doc_count": genes, "gene_count": {"value": genes}},
    }


def slim_term_frequency(*buckets):
    """``aggregations`` returned to ``get_genes_stats()``."""
    return {
        "slim_term_frequency": {
            "doc_count": sum(b["doc_count"] for b in buckets),
            "distinct_slim_term_frequency": {
                "doc_count_error_upper_bound": 0,
                "sum_other_doc_count": 0,
                "buckets": list(buckets),
            },
        }
    }


def term_bucket(id, label, aspect, genes, slim_ids=(), annotations=None):
    """A ``term_frequency`` bucket produced by ``get_annotation_terms_query()``."""
    source = {"slim_terms": [{"id": s} for s in slim_ids], "term": {"aspect": aspect, "id": id, "label": label}}
    return {
        "key": id,
        "doc_count": genes if annotations is None else annotations,
        "docs": top_hits(source),
        "distinct_genes": {"value": genes},
    }


def term_frequency(*buckets):
    """``aggregations`` returned to ``get_terms_stats()``."""
    return {"term_frequency": {"doc_count_error_upper_bound": 0, "sum_other_doc_count": 0, "buckets": list(buckets)}}


def slim_label_bucket(id, label, aspect, count):
    """A bucket of the ``slimTermsAutocomplete`` aggregation, which is keyed by label."""
    return {
        "key": label,
        "doc_count": count,
        "docs": top_hits({"aspect": aspect, "id": id, "label": label}, nested_field="slim_terms"),
    }


def slim_label_frequency(*buckets):
    """``aggregations`` returned to ``get_slim_term_autocomplete_query_multi()``."""
    return {
        "slim_term_frequency": {
            "doc_count": sum(b["doc_count"] for b in buckets),
            "distinct_slim_term_frequency": {
                "doc_count_error_upper_bound": 0,
                "sum_other_doc_count": 0,
                "buckets": list(buckets),
            },
        }
    }


def keyword_frequency(counts: dict):
    """A plain ``terms`` aggregation result, e.g. ``{"known": 14, "unknown": 8}``."""
    return {
        "doc_count_error_upper_bound": 0,
        "sum_other_doc_count": 0,
        "buckets": [{"key": key, "doc_count": n} for key, n in counts.items()],
    }
