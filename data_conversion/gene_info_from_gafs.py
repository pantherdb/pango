#!/usr/bin/python3

import argparse
import json
import csv
from typing import List


parser = argparse.ArgumentParser()
parser.add_argument('-a', '--annotation_gafs', nargs='*')
parser.add_argument('-g', '--gene_dat')
parser.add_argument('-n', '--gene_node_dat')
parser.add_argument('-c', '--genome_coordinates_file', help="If supplied, will be added to gene info. Typically, "
                                                            "a file named Homo_sapiens.chromosomal_location")


class GeneInfoCollection:
    def __init__(self):
        self.gene_info_dict = {}

    def extract_from_annotation_json(self, annotation_json: str):
        with open(annotation_json) as ajf:
            annotations = json.load(ajf)

        for annot in annotations:
            gene_id = annot["gene"]
            self.gene_info_dict[gene_id] = {
                "gene": gene_id
            }
            for ev in annot["evidence"]:
                with_gene_id = ev["with_gene_id"]
                self.gene_info_dict[with_gene_id] = {
                    "gene": with_gene_id
                }

    def extract_from_annotation_gaf(self, annotation_gafs):
        if not isinstance(annotation_gafs, List):
            annotation_gafs = [annotation_gafs]
        for annot_file in annotation_gafs:
            with open(annot_file) as af:
                reader = csv.reader(af, delimiter="\t")
                for r in reader:
                    if r[0].startswith("!"):
                        continue
                    self.add_genes_from_row(r)

    def add_genes_from_row(self, csv_row: List):
        gene_id = "{}:{}".format(csv_row[0], csv_row[1])
        gene_symbol = csv_row[2]
        gene_name = csv_row[9]
        gene_taxon = csv_row[12].replace("taxon:", "")
        self.gene_info_dict[gene_id] = {
            "gene": gene_id,
            "gene_symbol": gene_symbol,
            "gene_name": gene_name,
            "taxon_id": gene_taxon,
        }
        with_from_raw = csv_row[7]
        if "|" in with_from_raw:
            with_gene_id = with_from_raw.split("|", maxsplit=1)[1]
            with_gene_symbol = csv_row[18]
            with_gene_name = csv_row[19]
            with_gene_taxon_id = csv_row[20].replace("taxon:", "")
            self.gene_info_dict[with_gene_id] = {
                "gene": with_gene_id,
                "gene_symbol": with_gene_symbol,
                "gene_name": with_gene_name,
                "taxon_id": with_gene_taxon_id,
            }

    def fill_in_gene_symbol_name(self, gene_dat_file: str):

        with open(gene_dat_file) as gf:
            reader = csv.reader(gf, delimiter="\t")
            for r in reader:
                long_id = r[0]
                oscode, mod_id, uniprot_id = long_id.split("|")
                uniprot_id_curie = uniprot_id.replace("=", ":")
                if uniprot_id_curie in self.gene_info_dict or oscode == "HUMAN":
                    gene_id = uniprot_id_curie
                else:
                    # Try linking by mod_id, for non-human genes
                    gene_id = mod_id.replace("=", ":")
                if gene_id in self.gene_info_dict or oscode == "HUMAN":
                    if gene_id not in self.gene_info_dict:
                        # These cases are from human genes not in GAF so, need to be filled in
                        self.gene_info_dict[gene_id] = {
                            "gene": gene_id,
                            "gene_symbol": "",
                            "taxon_id": "9606",
                        }
                    gene_symbol = r[2]
                    gene_name = r[1]
                    if self.gene_info_dict[gene_id]["gene_symbol"] == "":
                        self.gene_info_dict[gene_id]["gene_symbol"] = gene_symbol
                    if self.gene_info_dict[gene_id]["gene_symbol"] == "":
                        # Duplicating symbol filling logic from createGAF.pl
                        self.gene_info_dict[gene_id]["gene_symbol"] = gene_id.split(":", maxsplit=1)[1]
                    self.gene_info_dict[gene_id]["gene_name"] = gene_name
                    self.gene_info_dict[gene_id]["long_id"] = long_id
                    # self.gene_info_dict[gene_id]["taxon_id"] = species_oscode_to_taxon_id[oscode]

    def fill_in_gene_panther_family(self, gene_node_dat_file):
        with open(gene_node_dat_file) as gnf:
            reader = csv.reader(gnf, delimiter="\t")
            for r in reader:
                long_id = r[0]
                oscode, mod_id, uniprot_id = long_id.split("|")
                gene_id = uniprot_id.replace("=", ":")
                if gene_id in self.gene_info_dict:
                    pthr_an = r[1]
                    pthr_fam, node_an = pthr_an.split(":", maxsplit=1)
                    self.gene_info_dict[gene_id]["panther_family"] = pthr_fam

    def fill_in_genome_coordinates(self, coordinates_file: str):
        with open(coordinates_file) as cf:
            reader = csv.reader(cf, delimiter="\t")
            for r in reader:
                long_id = r[0]
                oscode, mod_id, uniprot_id = long_id.split("|")
                gene_id = uniprot_id.replace("=", ":")
                if gene_id in self.gene_info_dict:
                    chr_num = r[1]
                    start = r[2]
                    end = r[3]
                    strand = r[4]
                    self.gene_info_dict[gene_id]["coordinates_chr_num"] = chr_num
                    self.gene_info_dict[gene_id]["coordinates_start"] = start
                    self.gene_info_dict[gene_id]["coordinates_end"] = end
                    self.gene_info_dict[gene_id]["coordinates_strand"] = strand

    def gene_info_list(self):
        gene_infos = []
        for gene, gene_info in self.gene_info_dict.items():
            gene_info_record = {
                "gene": gene,
                "gene_symbol": gene_info["gene_symbol"],
                "gene_name": gene_info["gene_name"],
                "taxon_id": gene_info["taxon_id"],
                "panther_family": gene_info.get("panther_family"),  # can be None
                "long_id": gene_info.get("long_id"),  # can be None
            }
            coordinate_fields = ["coordinates_chr_num", "coordinates_start", "coordinates_end", "coordinates_strand"]
            for coord_field in coordinate_fields:
                if coord_field in gene_info:
                    gene_info_record[coord_field] = gene_info[coord_field]
            gene_infos.append(gene_info_record)
        return gene_infos

    def print_genes_to_json(self):
        print(json.dumps(self.gene_info_list(), indent=4))


if __name__ == "__main__":
    args = parser.parse_args()

    gene_info_collection = GeneInfoCollection()
    gene_info_collection.extract_from_annotation_gaf(args.annotation_gafs)

    gene_info_collection.fill_in_gene_symbol_name(args.gene_dat)
    gene_info_collection.fill_in_gene_panther_family(args.gene_node_dat)
    gene_info_collection.fill_in_genome_coordinates(args.genome_coordinates_file)

    gene_info_collection.print_genes_to_json()
