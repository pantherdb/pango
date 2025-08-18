import argparse
import json
import csv
from typing import Dict, List


parser = argparse.ArgumentParser()
parser.add_argument('-a', '--gene_annotations_file', help="Gene annotations JSON file")
parser.add_argument('-t', '--terms_file', help="Terms JSON file")
parser.add_argument('-g', '--gene_info_file', help="Gene info JSON file")
parser.add_argument('-j', '--output_file', help="Output JSON file")
parser.add_argument('-s', '--output_tsv', help="Output TSV file")
parser.add_argument('-u', '--output_stats', help="Output stats TSV file")


def merge_gene_data(gene_annots: List, terms: List, gene_infos: List, output_json: str, output_tsv: str):

    # Create lookup dictionaries for efficient matching
    terms_dict = {term['ID']: term for term in terms}
    gene_info_dict = {gene['gene']: gene for gene in gene_infos}
    gene_annot_counts = {annot['gene']: 0 for annot in gene_annots}

    # Merge the data
    merged_data = []
    for annotation in gene_annots:
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
            if term.startswith("GO:"):
                gene_annot_counts[gene] += 1

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

    # Write out gene annot stats
    with open(args.output_stats, 'w') as f:
        writer = csv.writer(f, delimiter='\t')
        writer.writerow(['UniProt current', 'UniProt functionome', 'additional information to display'])
        for gene, count in gene_annot_counts.items():
            if count == 1:
                count_str = "1 GO annotation based on evolutionary models"
            else:
                count_str = "{} GO annotations based on evolutionary models".format(count)
            uniprot_id = gene.replace("UniProtKB:", "")
            writer.writerow([uniprot_id, uniprot_id, count_str])


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