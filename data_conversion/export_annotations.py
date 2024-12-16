import argparse
import json
import csv
from typing import Dict


parser = argparse.ArgumentParser()
parser.add_argument('-a', '--gene_annotations_file', help="Gene annotations JSON file")
parser.add_argument('-t', '--terms_file', help="Terms JSON file")
parser.add_argument('-g', '--gene_info_file', help="Gene info JSON file")
parser.add_argument('-j', '--output_file', help="Output JSON file")
parser.add_argument('-s', '--output_tsv', help="Output TSV file")


def merge_gene_data(gene_annots: Dict, terms: Dict, gene_infos: Dict, output_json: str, output_tsv: str):

    # Create lookup dictionaries for efficient matching
    terms_dict = {term['ID']: term for term in terms}
    gene_info_dict = {gene['gene']: gene for gene in gene_info}

    # Merge the data
    merged_data = []
    for annotation in gene_annotations:
        gene = annotation['gene']
        term = annotation['term']

        # Check if we have matching gene info and term
        if gene in gene_info_dict and term in terms_dict:
            merged_entry = {
                'gene': gene,
                'gene_symbol': gene_info_dict[gene]['gene_symbol'],
                'gene_name': gene_info_dict[gene]['gene_name'],
                'term_id': term,
                'term_label': terms_dict[term]['LABEL']
            }
            merged_data.append(merged_entry)

    # Write output to JSON file
    with open(output_json, 'w') as f:
        json.dump(merged_data, f)

    # Write output to TSV file
    with open(output_tsv, 'w') as f:
        writer = csv.DictWriter(f, fieldnames=merged_data[0].keys(), delimiter='\t')
        writer.writeheader()
        writer.writerows(merged_data)

    print(f"Merged data written to {output_json} and {output_tsv}")
    print(f"Total entries merged: {len(merged_data)}")


if __name__ == "__main__":
    args = parser.parse_args()
    # Load JSON files
    with open(args.gene_annotations_file, 'r') as f:
        gene_annotations = json.load(f)

    with open(args.terms_file, 'r') as f:
        terms = json.load(f)

    with open(args.gene_info_file, 'r') as f:
        gene_info = json.load(f)

    merge_gene_data(
        gene_annotations,
        terms,
        gene_info,
        args.output_file,
        args.output_tsv
    )