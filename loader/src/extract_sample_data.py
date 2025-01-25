import argparse
import json
import pandas as pd
import os
from os import path as ospath

def parse_arguments():
    parser = argparse.ArgumentParser(description='Extract sample data from annotation files')
    parser.add_argument('-a', dest='annos_fp', required=True, type=str)
    parser.add_argument('-t', dest='terms_fp', required=True, type=str)
    parser.add_argument('-art', dest='articles_fp', required=True, type=str)
    parser.add_argument('-tax', dest='taxon_fp', required=True, type=str)
    parser.add_argument('-g', dest='genes_fp', required=True, type=str)
    parser.add_argument('-n', dest='sample_size', type=int, default=10)
    parser.add_argument('-s', dest='seed', type=int, default=42)
    parser.add_argument('-o', dest='output_dir', default='.')
    return parser.parse_args()

def load_json(filepath):
    with open(filepath, encoding='utf-8') as f:
        return pd.DataFrame(json.load(f))

def save_json(data, filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        if isinstance(data, pd.DataFrame):
            data.to_json(f, orient='records', force_ascii=False, indent=2)
        else:
            json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Saved: {filepath}")

def extract_sample_data(args):
    print("Loading files...")
    annos = load_json(args.annos_fp)
    terms = load_json(args.terms_fp)
    articles = load_json(args.articles_fp)
    taxon = load_json(args.taxon_fp)
    genes = load_json(args.genes_fp)
    
    sample_annos = annos.sample(n=min(args.sample_size, len(annos)), random_state=args.seed)
    
    unique_terms = set()
    unique_articles = set()
    unique_genes = set()
    
    for _, row in sample_annos.iterrows():
        unique_terms.add(row['term'])
        unique_terms.update(row['slim_terms'])
        unique_genes.add(row['gene'])
        for evidence in row['evidence']:
            unique_articles.update(evidence['references'])
            if 'with_gene_id' in evidence:
                unique_genes.add(evidence['with_gene_id'])
    
    sample_terms = terms[terms['ID'].isin(unique_terms)]
    sample_articles = articles[articles['pmid'].isin(unique_articles)]
    sample_genes = genes[genes['gene'].isin(unique_genes)]
    sample_taxon = taxon[taxon['taxon_id'].isin(sample_genes['taxon_id'].unique())]
    
    print(f"\nSaving to {args.output_dir}...")
    save_json(sample_annos, ospath.join(args.output_dir, ospath.basename(args.annos_fp)))
    save_json(sample_terms, ospath.join(args.output_dir, ospath.basename(args.terms_fp)))
    save_json(sample_articles, ospath.join(args.output_dir, ospath.basename(args.articles_fp)))
    save_json(sample_taxon, ospath.join(args.output_dir, ospath.basename(args.taxon_fp)))
    save_json(sample_genes, ospath.join(args.output_dir, ospath.basename(args.genes_fp)))
    
    print(f"Done. Counts: annotations={len(sample_annos)}, terms={len(sample_terms)}, "
          f"articles={len(sample_articles)}, genes={len(sample_genes)}, taxons={len(sample_taxon)}")

if __name__ == "__main__":
    args = parse_arguments()
    extract_sample_data(args)