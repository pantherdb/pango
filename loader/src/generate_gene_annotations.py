import argparse
import json
from os import path as ospath
import pandas as pd
from src.config.base import file_path
from src.utils import write_to_json

COLUMNS_TO_EXTRACT = [
    'gene_symbol',
    'gene_name', 
    'taxon_id',
    'taxon_label',
    'taxon_abbr',
    'panther_family',
    'long_id',
    'coordinates_chr_num',
    'coordinates_start',
    'coordinates_end'   
]

def main():
    parser = parse_arguments()
    annos_df = get_annos(parser.annos_fp)
    anno_json = annos_df.to_json(orient="records", default_handler=None)
    json_str = json.loads(anno_json)

    write_to_json(json_str, ospath.join('.', parser.genes_annos_fp))


def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('-a', dest='annos_fp', required=True,
                        type=file_path, help='cealn annos Json')
    parser.add_argument('-o', dest='genes_annos_fp', required=True,
                         help='Output of Clean anno')

    return parser.parse_args()


def uniquify_term(series, evidence_series):
    unique_terms = {}
    term_counts = {}

    for idx, item in enumerate(series):
        if isinstance(item, dict):
            term_id = item['id']
            term = item.copy()  
            term.pop('is_goslim', None)
            term['evidence_type'] = evidence_series.iloc[idx] 
            
            if term_id in term_counts:
                raise ValueError(f"Duplicate term found: {term}")
            else:
                term_counts[term_id] = 1

            unique_terms[term_id] = term
            
    return list(unique_terms.values())

def uniquify_slim_terms(series, evidence_series):
    unique_terms = {}
    for idx, item_list in enumerate(series):
        if isinstance(item_list, list):
            for item in item_list:
                term = item.copy()  
                term.pop('is_goslim', None) 
                term['evidence_type'] = evidence_series.iloc[idx] 
                unique_terms[term['id']] = term
    return list(unique_terms.values())

def group_terms(group):
    unique_terms = uniquify_term(group['term'], group['evidence_type'])
    slim_terms = uniquify_slim_terms(group['slim_terms'], group['evidence_type'])
    return pd.Series({
        **{col: group[col].iloc[0] for col in COLUMNS_TO_EXTRACT},
        'terms': unique_terms,
        'slim_terms': slim_terms,
        'term_count': len(unique_terms)
    })




def get_annos(annos_fp):   

    annos_df = pd.read_json(annos_fp)
    annos_df = annos_df.drop(['evidence'], axis=1)
    genes_df = annos_df.groupby('gene').apply(group_terms).reset_index()
    genes_df = genes_df.sort_values(by='term_count', ascending=False).reset_index(drop=True)

    return genes_df


if __name__ == "__main__":
    main()
