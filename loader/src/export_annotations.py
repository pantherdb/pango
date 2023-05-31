import argparse
import json
from os import path as ospath
import time
import numpy as np
import pandas as pd
from src.config.base import file_path
from src.utils import get_pd_row, write_to_json

def main():
    parser = parse_arguments()
    terms_df = get_terms_map(parser.terms_fp)
    genes_df = get_genes_map(parser.genes_fp)
    annos_df = get_annos(parser.annos_fp, terms_df, genes_df)
    
    #to json
    anno_json = annos_df.to_json(orient="records", default_handler=None)
    json_str = json.loads(anno_json)
    write_to_json(json_str, ospath.join('.', parser.output_json_fp), zip=True)

    #to csv
    compression_opts = dict(method='zip', archive_name='annotations.csv')  
    annos_df.to_csv(ospath.join('.', parser.output_tsv_fp), sep='\t', 
                    index=False, compression=compression_opts)  
   


def parse_arguments():
    parser = argparse.ArgumentParser(description='PreLoad Processing',
                                     epilog='It should probably work!')
    parser.add_argument('-a', dest='annos_fp', required=True,
                        type=file_path, help='annos Json')
    parser.add_argument('-t', dest='terms_fp', required=True,
                        type=file_path, help='Terms Json')
    parser.add_argument('-g', dest='genes_fp', required=True,
                        type=file_path, help='Genes Json')
    parser.add_argument('--ojson', dest='output_json_fp', required=True,
                         help='Output of json')
    parser.add_argument('--otsv', dest='output_tsv_fp', required=True,
                         help='Output of tsv')
    

    return parser.parse_args()

# Terms
def get_terms_map(terms_fp):
    terms_df = pd.read_json(terms_fp, dtype={'is_goslim':bool})
    terms_df = terms_df.set_index('ID', drop=False)
    terms_df = terms_df.rename(columns={'ID': 'id', 'LABEL': 'label', 'hasOBONamespace':'aspect'})
    return terms_df

# Gene
def get_genes_map(genes_fp):
    genes_df = pd.read_json(genes_fp, dtype={'taxon_id':str})
    genes_df = genes_df.set_index('gene', drop=False)
    return genes_df


def term_display_id(term):
    return term['id'] if term['id'].startswith("GO") else ''


def get_annos(annos_fp, terms_df, genes_df):
    fields=['gene', 'term']
    
    annos_df = pd.read_json(annos_fp)
    annos_df = annos_df[fields]
    annos_df = annos_df.merge(genes_df[
        ['gene_symbol',
        'gene_name']], how='left', left_on="gene", right_index=True)
    annos_df['term'] = annos_df['term'].apply(lambda x: get_pd_row(terms_df, x))
    annos_df['term_id'] = annos_df['term'].apply(lambda x: term_display_id(x))
    annos_df['term_label'] = annos_df['term'].apply(lambda x: x['label'])
    annos_df = annos_df.drop(columns=['term']) 

    return annos_df


if __name__ == "__main__":
    main()
