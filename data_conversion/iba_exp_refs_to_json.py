#!/usr/bin/python3

import argparse
import csv
import json
from typing import List


parser = argparse.ArgumentParser()
parser.add_argument('-f', '--annot_files', help="IBA GAF file with extra EXP_REF field; Will be an 'exploded' GAF "
                                                "containing multiple lines per annotation with one line per with/from"
                                                " value")
parser.add_argument('-o', '--ontology', help="TSV of GO term parent(col1)-child(col2) relationships (is_a, part_of only)")
parser.add_argument('-a', '--go_aspects', help="TSV of GO term->aspect lookup")
parser.add_argument('-s', '--goslim_term_list', help="File list of the Generic GO slim terms")
parser.add_argument('-g', '--gene_info_only', action='store_const', const=True, help="Only print out the distinct "
                                                                                     "gene info for annotations. No "
                                                                                     "annotations printed. Includes "
                                                                                     "genes in evidence")


if __name__ == "__main__":
    def generalize_term(goterm: str, new_terms: List = None):
        # Roll up annotated term to goslim_generic
        if new_terms is None:
            new_terms = []
        if goterm not in goslim_terms:
            if goterm not in go_parents:
                return []
            for parent_term in go_parents[goterm]:
                if go_aspects[parent_term] != go_aspects[goterm]:
                    continue
                for new_term in generalize_term(parent_term, new_terms):
                    if new_term not in new_terms:
                        new_terms.append(new_term)
            return new_terms
        else:
            return [goterm]

    def update_annot_from_row(csv_row: List):
        gene_id = "{}:{}".format(csv_row[0], csv_row[1])
        go_term = csv_row[4]
        qualifier = csv_row[3]  # Currently treating as only one

        if gene_id not in annotation_lkp:
            annotation_lkp[gene_id] = {}
        if go_term not in annotation_lkp[gene_id]:
            annotation_lkp[gene_id][go_term] = {}
        if qualifier not in annotation_lkp[gene_id][go_term]:
            # No annot exists so make one
            slim_terms = generalize_term(go_term)
            gene_symbol = csv_row[2]
            gene_name = csv_row[9]
            gene_taxon = csv_row[12]
            add_gene_info_to_lkp(gene_id, gene_symbol, gene_name, gene_taxon)
            group = csv_row[14]
            qualifier_val = None  # Default
            if qualifier in ["contributes_to", "colocalizes_with"]:
                # value can only be "contributes_to" or "colocalizes_with"
                qualifier_val = qualifier
            new_annot = {
                "gene": gene_id,
                "gene_symbol": gene_symbol,
                "gene_name": gene_name,
                "term": go_term,
                "slim_terms": slim_terms,
                "qualifier": qualifier_val,
                # "references": {},  # Will be handled later
                "evidence": [],  # Will be handled later
                "group": group,
            }
            annotation_lkp[gene_id][go_term][qualifier] = new_annot

        # Merge experimental references
        annotation_lkp[gene_id][go_term][qualifier]["evidence"] = merge_exp_evidence(
            annotation_lkp[gene_id][go_term][qualifier]["evidence"],
            csv_row
        )

    def parse_exp_gene_and_refs_from_row(csv_row: List):
        with_from_raw = csv_row[7]
        with_gene_id = with_from_raw.split("|", maxsplit=1)[1]
        with_gene_symbol = csv_row[18]
        with_gene_name = csv_row[19]
        with_gene_taxon_id = csv_row[20]
        add_gene_info_to_lkp(with_gene_id, with_gene_symbol, with_gene_name, with_gene_taxon_id)
        exp_pmids = sorted(csv_row[17].split("|"))
        return with_gene_id, exp_pmids

    def merge_exp_evidence(evidence, csv_row):
        with_gene_id, exp_pmids = parse_exp_gene_and_refs_from_row(csv_row)
        ev_obj = {"with_gene_id": with_gene_id, "references": exp_pmids}
        if ev_obj not in evidence:
            evidence.append(ev_obj)
        # evidence[with_gene_id] = list(set(evidence[with_gene_id]) | set(exp_pmids))
        return evidence

    def add_gene_info_to_lkp(gene_id, gene_sym, gene_name, taxon_id):
        if "taxon:" in taxon_id:
            taxon_id = taxon_id.split(":", maxsplit=1)[1]
        gene_info_lkp[gene_id] = {
            "gene_symbol": gene_sym,
            "gene_name": gene_name,
            "taxon_id": taxon_id,
        }

    args = parser.parse_args()

    goslim_terms = set()
    with open(args.goslim_term_list) as gtl:
        for l in gtl.readlines():
            goslim_terms.add(l.rstrip())

    go_parents = {}
    with open(args.ontology) as of:
        reader = csv.reader(of, delimiter="\t")
        for r in reader:
            parent, child = r
            if child not in go_parents:
                go_parents[child] = set()
            go_parents[child].add(parent)

    go_aspects = {}
    with open(args.go_aspects) as ga:
        reader = csv.reader(ga, delimiter="\t")
        for r in reader:
            term = r[0]
            aspect = r[1]
            go_aspects[term] = aspect

    annotation_lkp = {}  # Goes Gene->Term->Qualifiers
    gene_info_lkp = {}
    with open(args.annot_files) as af:
        reader = csv.reader(af, delimiter="\t")
        for r in reader:
            if r[0].startswith("!"):
                continue
            update_annot_from_row(r)

    annotations = []
    for gene in annotation_lkp:
        for term in annotation_lkp[gene]:
            for quals, annot in annotation_lkp[gene][term].items():
                if "NOT" in quals:
                    # Do not include negative annotations
                    continue
                annotations.append(annot)

    if args.gene_info_only:
        gene_infos = []
        for gene, gene_info in gene_info_lkp.items():
            gene_infos.append({
                "gene": gene,
                "gene_symbol": gene_info["gene_symbol"],
                "gene_name": gene_info["gene_name"],
                "taxon_id": gene_info["taxon_id"],
            })
        print(json.dumps(gene_infos, indent=4))
    else:
        print(json.dumps(annotations, indent=4))

