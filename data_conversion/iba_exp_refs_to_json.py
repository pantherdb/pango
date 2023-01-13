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
parser.add_argument('-p', '--gene_dat', help="If supplied, all PANTHER genes will have at least 3 annotations, falling "
                                             "back on 'UNKNOWN:' aspect term if no annotation")


class OntologyManager:
    OTHER_TERMS = {
        "molecular_function": "OTHER:0001",
        "biological_process": "OTHER:0002",
        "cellular_component": "OTHER:0003",
    }
    UNKNOWN_TERMS = {
        "molecular_function": "UNKNOWN:0001",
        "biological_process": "UNKNOWN:0002",
        "cellular_component": "UNKNOWN:0003",
    }

    def __init__(self, goslim_term_list: str, ontology: str, go_aspects: str):
        self.goslim_terms = set()
        with open(goslim_term_list) as gtl:
            for l in gtl.readlines():
                self.goslim_terms.add(l.rstrip())

        self.go_parents = {}
        with open(ontology) as of:
            reader = csv.reader(of, delimiter="\t")
            for r in reader:
                parent, child = r
                if child not in self.go_parents:
                    self.go_parents[child] = set()
                self.go_parents[child].add(parent)

        self.go_aspects = {}
        with open(go_aspects) as ga:
            reader = csv.reader(ga, delimiter="\t")
            for r in reader:
                term = r[0]
                aspect = r[1]
                self.go_aspects[term] = aspect

    def generalize_term(self, goterm: str, new_terms: List = None):
        # Roll up annotated term to goslim_generic
        if new_terms is None:
            new_terms = []
        if goterm not in self.goslim_terms:
            if goterm not in self.go_parents:
                return []
            for parent_term in self.go_parents[goterm]:
                if self.go_aspects[parent_term] != self.go_aspects[goterm]:
                    continue
                for new_term in self.generalize_term(parent_term, new_terms):
                    if new_term not in new_terms:
                        new_terms.append(new_term)
            return new_terms
        else:
            return [goterm]

    def other_term(self, goterm: str):
        return self.OTHER_TERMS[self.go_aspects[goterm]]

    def unknown_term(self, goterm: str):
        return self.UNKNOWN_TERMS[self.go_aspects[goterm]]


class IbaExpRefCollection:
    def __init__(self, ontology_manager: OntologyManager):
        self.annotation_lkp = {}  # Goes Gene->Term->Qualifiers
        self.gene_info_lkp = {}
        self.ontology_manager = ontology_manager

    def update_annot_from_row(self, csv_row: List):
        gene_id = "{}:{}".format(csv_row[0], csv_row[1])
        go_term = csv_row[4]
        qualifier = csv_row[3]  # Currently treating as only one

        if gene_id not in self.annotation_lkp:
            self.annotation_lkp[gene_id] = {}
        if go_term not in self.annotation_lkp[gene_id]:
            self.annotation_lkp[gene_id][go_term] = {}
        if qualifier not in self.annotation_lkp[gene_id][go_term]:
            # No annot exists so make one
            slim_terms = self.ontology_manager.generalize_term(go_term)
            if len(slim_terms) == 0:
                # Fill empty "slim_terms" field with aspect-specific "Other" term
                slim_terms = [self.ontology_manager.other_term(go_term)]
            gene_symbol = csv_row[2]
            gene_name = csv_row[9]
            gene_taxon = csv_row[12]
            self.add_gene_info_to_lkp(gene_id, gene_symbol, gene_name, gene_taxon)
            group = csv_row[14]
            qualifier_val = None  # Default
            if qualifier in ["contributes_to", "colocalizes_with"]:
                # value can only be "contributes_to" or "colocalizes_with"
                qualifier_val = qualifier
            new_annot = self.create_annotation_for_gene(gene_id, gene_symbol, gene_name, go_term)
            new_annot["slim_terms"] = slim_terms
            new_annot["qualifier"] = qualifier_val
            new_annot["group"] = group
            self.annotation_lkp[gene_id][go_term][qualifier] = new_annot

        # Merge experimental references
        self.merge_exp_evidence(gene_id, go_term, qualifier, csv_row)

    def add_gene_info_to_lkp(self, gene_id, gene_sym, gene_name, taxon_id):
        if "taxon:" in taxon_id:
            taxon_id = taxon_id.split(":", maxsplit=1)[1]
        self.gene_info_lkp[gene_id] = {
            "gene_symbol": gene_sym,
            "gene_name": gene_name,
            "taxon_id": taxon_id,
        }

    def parse_exp_gene_and_refs_from_row(self, csv_row: List):
        with_from_raw = csv_row[7]
        with_gene_id = with_from_raw.split("|", maxsplit=1)[1]
        with_gene_symbol = csv_row[18]
        with_gene_name = csv_row[19]
        with_gene_taxon_id = csv_row[20]
        self.add_gene_info_to_lkp(with_gene_id, with_gene_symbol, with_gene_name, with_gene_taxon_id)
        exp_pmids = sorted(csv_row[17].split("|"))
        exp_group = csv_row[21]
        return with_gene_id, exp_pmids, exp_group

    def merge_exp_evidence(self, gene_id: str, go_term: str, qualifier: str, csv_row: List):
        with_gene_id, exp_pmids, exp_group = self.parse_exp_gene_and_refs_from_row(csv_row)
        ev_obj = {
            "with_gene_id": with_gene_id,
            "references": exp_pmids,
            "group": exp_group
        }
        evidence = self.annotation_lkp[gene_id][go_term][qualifier]["evidence"]  # Assumes everything exists
        if ev_obj not in evidence:
            if with_gene_id == gene_id:
                evidence.insert(0, ev_obj)
            else:
                evidence.append(ev_obj)
        self.annotation_lkp[gene_id][go_term][qualifier]["evidence"] = evidence

    def annotation_list(self):
        annotations = []
        for gene in self.annotation_lkp:
            for term in self.annotation_lkp[gene]:
                for quals, annot in self.annotation_lkp[gene][term].items():
                    if "NOT" in quals:
                        # Do not include negative annotations
                        continue
                    annotations.append(annot)
        return annotations

    def gene_info_list(self):
        gene_infos = []
        for gene, gene_info in self.gene_info_lkp.items():
            gene_infos.append({
                "gene": gene,
                "gene_symbol": gene_info["gene_symbol"],
                "gene_name": gene_info["gene_name"],
                "taxon_id": gene_info["taxon_id"],
            })
        return gene_infos

    def print_annotations_to_json(self):
        print(json.dumps(self.annotation_list(), indent=4))

    def print_genes_to_json(self):
        print(json.dumps(self.gene_info_list(), indent=4))

    def create_annotation_for_gene(self, gene_id, gene_symbol, gene_name, term):
        new_annot = {
            "gene": gene_id,
            "gene_symbol": gene_symbol,
            "gene_name": gene_name,
            "term": term,
            "slim_terms": [],
            "qualifier": None,
            "evidence": [],  # Will be handled later
            "group": None,
        }
        return new_annot

    def fill_in_missing_annotations(self, gene_dat):
        # Iterate through gene_dat, attempt fetching term for each aspect, if blank add UNKNOWN term
        with open(gene_dat) as gf:
            reader = csv.reader(gf, delimiter="\t")
            for r in reader:
                long_id = r[0]
                oscode, mod_id, uniprot_id = long_id.split("|")
                if oscode != "HUMAN":
                    continue
                gene_id = uniprot_id.replace("=", ":")
                gene_name = r[1]
                gene_symbol = r[2]
                if gene_id not in self.annotation_lkp:
                    self.annotation_lkp[gene_id] = {}
                has_aspect = {"molecular_function": False, "biological_process": False, "cellular_component": False}
                for term in self.annotation_lkp[gene_id]:
                    # get aspect of term
                    term_aspect = self.ontology_manager.go_aspects[term]
                    has_aspect[term_aspect] = True
                for aspect, result in has_aspect.items():
                    if not result:
                        unknown_aspect_term = self.ontology_manager.UNKNOWN_TERMS[aspect]
                        new_annot = self.create_annotation_for_gene(gene_id, gene_name, gene_symbol, unknown_aspect_term)
                        new_annot["slim_terms"] = [unknown_aspect_term]
                        new_annot["group"] = "GO_Central"
                        self.annotation_lkp[gene_id][unknown_aspect_term] = {"": new_annot}


class IbaExpRefManager:
    @staticmethod
    def parse(iba_file, ontology_manager: OntologyManager):
        new_collection = IbaExpRefCollection(ontology_manager)
        with open(iba_file) as af:
            reader = csv.reader(af, delimiter="\t")
            for r in reader:
                if r[0].startswith("!"):
                    continue
                new_collection.update_annot_from_row(r)
        return new_collection


if __name__ == "__main__":
    args = parser.parse_args()

    ont_manager = OntologyManager(args.goslim_term_list,
                                  args.ontology,
                                  args.go_aspects)
    iba_exp_ref_collection = IbaExpRefManager.parse(args.annot_files, ont_manager)
    if args.gene_dat:
        iba_exp_ref_collection.fill_in_missing_annotations(args.gene_dat)

    if args.gene_info_only:
        iba_exp_ref_collection.print_genes_to_json()
    else:
        iba_exp_ref_collection.print_annotations_to_json()
