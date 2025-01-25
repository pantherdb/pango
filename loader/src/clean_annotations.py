import argparse
import json
from os import path as ospath
import numpy as np
import pandas as pd
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from src.config.base import file_path
from src.utils import write_to_json

UNKNOWN_TERMS = frozenset({'UNKNOWN:0001', 'UNKNOWN:0002', 'UNKNOWN:0003'})
MAX_WORKERS = 4

def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('-a', dest='annos_fp', required=True, type=file_path)
    parser.add_argument('-t', dest='terms_fp', required=True, type=file_path)
    parser.add_argument('-art', dest='articles_fp', required=True, type=file_path)
    parser.add_argument('-tax', dest='taxon_fp', required=True, type=file_path)
    parser.add_argument('-g', dest='genes_fp', required=True, type=file_path)
    parser.add_argument('-o', dest='clean_annos_fp', required=True)
    return parser.parse_args()

def process_terms(terms_fp):
    terms = pd.read_json(terms_fp, dtype={'is_goslim': bool})
    terms.set_index('ID', drop=False, inplace=True)
    terms.rename(columns={
        'ID': 'id',
        'LABEL': 'label',
        'hasOBONamespace': 'aspect'
    }, inplace=True)
    terms['aspect'] = terms['aspect'].str.replace('_', ' ')
    return terms

def process_genes(genes_fp, taxon_df):
    genes_cols = [
        'gene_symbol', 'gene_name', 'taxon_id', 'taxon_label',
        'taxon_abbr', 'panther_family', 'long_id',
        'coordinates_chr_num', 'coordinates_start', 'coordinates_end'
    ]
    genes = pd.read_json(genes_fp, dtype={'taxon_id': str})
    genes = genes.merge(taxon_df, how='left', on='taxon_id')
    genes.set_index('gene', drop=False, inplace=True)
    return genes[genes_cols + ['gene']]

def process_evidence_batch(batch, articles_df, genes_df):
    results = []
    articles_dict = articles_df.to_dict('index')
    genes_dict = genes_df.to_dict('index')
    
    for _, row in batch.iterrows():
        evidence_list = []
        for evidence in row['evidence']:
            refs = [articles_dict.get(ref, {}) for ref in evidence['references']]
            gene = genes_dict.get(evidence['with_gene_id'], None)
            
            evidence_list.append({
                'with_gene_id': gene,
                'groups': evidence['groups'],
                'references': refs
            })
        results.append(evidence_list)
    return results

def process_annotations(annos_fp, terms_df, genes_df, articles_df):
    def term_type(term_id):
        return 'unknown' if term_id in UNKNOWN_TERMS else 'known'
    
    terms_dict = terms_df.to_dict('index')
    def get_term_info(term):
        return terms_dict.get(term, {'aspect': f'no{term}'})
    
    annos_df = pd.read_json(annos_fp)
    annos_df = annos_df.merge(genes_df, how='left', left_on="gene", right_index=True)
    
    # Pre-compute term-related columns
    annos_df['aspect'] = annos_df['term'].map(lambda t: get_term_info(t)['aspect'])
    annos_df['term'] = annos_df['term'].map(get_term_info)
    annos_df['term_type'] = annos_df['term'].map(lambda t: term_type(t['id']))
    annos_df['slim_terms'] = annos_df['slim_terms'].map(
        lambda terms: [get_term_info(t) for t in terms]
    )
    
    # Parallel processing for evidence
    batch_size = max(1, len(annos_df) // (MAX_WORKERS * 2))
    batches = [annos_df.iloc[i:i + batch_size] for i in range(0, len(annos_df), batch_size)]
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        process_batch = partial(process_evidence_batch, articles_df=articles_df, genes_df=genes_df)
        evidence_results = list(executor.map(process_batch, batches))
    
    # Flatten results
    annos_df['evidence'] = [item for batch in evidence_results for item in batch]
    
    # Post-process remaining columns
    annos_df['evidence_type'] = annos_df['evidence_type'].fillna('n/a')
    annos_df['groups'] = annos_df['evidence'].map(
        lambda evidences: list({group for evidence in evidences for group in evidence['groups']})
    )
    annos_df['evidence_count'] = annos_df['evidence'].map(len)
    
    return annos_df

def main():
    args = parse_arguments()
    
    # Load data
    terms_df = process_terms(args.terms_fp)
    articles_df = pd.read_json(args.articles_fp).set_index('pmid', drop=False)
    taxon_df = pd.read_json(args.taxon_fp, dtype={'taxon_id': str})
    genes_df = process_genes(args.genes_fp, taxon_df)
    
    # Process annotations
    annos_df = process_annotations(args.annos_fp, terms_df, genes_df, articles_df)
    
    # Write output
    json_data = json.loads(annos_df.to_json(orient="records"))
    write_to_json(json_data, ospath.join('.', args.clean_annos_fp))

if __name__ == "__main__":
    main()