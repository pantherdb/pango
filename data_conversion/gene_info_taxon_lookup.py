import argparse
import json
import csv


parser = argparse.ArgumentParser()
parser.add_argument('-g', '--gene_info_json')
parser.add_argument('-s', '--species_list_tsv')


if __name__ == "__main__":
    args = parser.parse_args()

    input_taxons = set()
    with open(args.gene_info_json) as gif:
        gene_infos = json.load(gif)
        [input_taxons.add(gi["taxon_id"]) for gi in gene_infos]

    taxon_objs = []

    with open(args.species_list_tsv) as slf:
        reader = csv.DictReader(slf, delimiter="\t")
        for r in reader:
            taxon_id = r["taxon_id"]
            if taxon_id and taxon_id in input_taxons:
                taxon_label = r["organism"]
                if " " in taxon_label:
                    genus, species = taxon_label.split(maxsplit=1)
                    taxon_abbr = genus[0] + species[:2]
                else:
                    taxon_abbr = taxon_label
                taxon_obj = {
                    "taxon_id": taxon_id,
                    "taxon_label": taxon_label,
                    "taxon_abbr": taxon_abbr
                }
                taxon_objs.append(taxon_obj)

    print(json.dumps(taxon_objs, indent=4))
