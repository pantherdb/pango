import argparse
import json
from os import path as ospath
import time
import numpy as np
import pandas as pd
from src.config.base import file_path
from src.utils import get_pd_row, get_pd_row_key, write_to_json

def main():
    parser = parse_arguments()
    terms_df = get_terms_map(parser.terms_fp)
    articles_df = get_articles_map(parser.articles_fp)
    taxon_df = get_taxon_map(parser.taxon_fp)
    genes_df = get_genes_map(parser.genes_fp, taxon_df)
    annos_df = get_annos(parser.annos_fp, terms_df, genes_df, articles_df)
    anno_json = annos_df.to_json(orient="records", default_handler=None)
    json_str = json.loads(anno_json)

    write_to_json(json_str, ospath.join('.', parser.clean_annos_fp))


def parse_arguments():
    parser = argparse.ArgumentParser(description='PreLoad Processing',
                                     epilog='It should probably work!')
    parser.add_argument('-a', dest='annos_fp', required=True,
                        type=file_path, help='annos Json')
    parser.add_argument('-t', dest='terms_fp', required=True,
                        type=file_path, help='Terms Json')
    parser.add_argument('-art', dest='articles_fp', required=True,
                        type=file_path, help='Articles Json')
    parser.add_argument('-tax', dest='taxon_fp', required=True,
                        type=file_path, help='taxon Json')
    parser.add_argument('-g', dest='genes_fp', required=True,
                        type=file_path, help='Genes Json')
    parser.add_argument('-o', dest='clean_annos_fp', required=True,
                         help='Output of Clean anno')

    return parser.parse_args()

def spread_terms(df, terms):
    return [get_pd_row(df, term) for term in terms]


def get_aspect(df, k):
    row = get_pd_row_key(df, k)
    if row is None:
        return 'no' + str(k)
    aspect = row.get('aspect', None)
    return aspect


def get_evidence(df, genes_df, row):
    result = []
    for evidence in row['evidence']:
        result_ref =[]
        for reference in evidence['references']:
            result_ref.append(get_pd_row_key(df, reference))
        gene_row = get_pd_row_key(genes_df, evidence['with_gene_id'])
       
        evidence_item = {
          'with_gene_id':gene_row,
          'group': evidence['group'],
          'references':result_ref
        }
        result.append(evidence_item)
            
    return result


def get_evidence_type(row):
    for evidence in row['evidence']:
        if evidence["with_gene_id"]['gene'] == row['gene']:
            return 'direct'
        if len(evidence['references']) == 0:
            return 'n/a' 
            
    return 'homology'


# Terms
def get_terms_map(terms_fp):
    terms_df = pd.read_json(terms_fp, dtype={'is_goslim':bool})
    terms_df = terms_df.set_index('ID', drop=False)
    terms_df = terms_df.rename(columns={'ID': 'id', 'LABEL': 'label', 'hasOBONamespace':'aspect'})
    terms_df['aspect'] = terms_df['aspect'].str.replace('_', ' ')
    return terms_df

#Article
def get_articles_map(articles_fp):
    articles_df = pd.read_json(articles_fp)
    articles_df = articles_df.set_index('pmid', drop=False)
    return articles_df

#Taxon
def get_taxon_map(taxon_fp):
    taxon_df = pd.read_json(taxon_fp, dtype={'taxon_id':str})
    return taxon_df


# Gene
def get_genes_map(genes_fp, taxon_df):
    genes_df = pd.read_json(genes_fp, dtype={'taxon_id':str})
    #genes_df['taxon_id'] = genes_df['taxon_id'].str.replace('taxon:', '')
    genes_df = genes_df.merge(taxon_df, how='left', on='taxon_id')
    genes_df = genes_df.set_index('gene', drop=False)
    return genes_df


def count_evidence(evidences):
    return len(evidences)


def get_groups(evidences):
    groups = set()
    for evidence in evidences:
        groups.add(evidence['group'])
    return list(groups)


def get_annos(annos_fp, terms_df, genes_df, articles_df):
    annos_df = pd.read_json(annos_fp)
    annos_df = annos_df.merge(genes_df[
        ['taxon_id', 
        'taxon_label', 
        'taxon_abbr',
        'panther_family',
        'long_id',
        'coordinates_chr_num',
        'coordinates_start',
        'coordinates_end']], how='left', left_on="gene", right_index=True)
    annos_df['aspect'] = annos_df['term'].apply(lambda x: get_pd_row(terms_df, x)['aspect'])
    annos_df['term'] = annos_df['term'].apply(lambda x: get_pd_row(terms_df, x))
    annos_df['slim_terms'] = annos_df['slim_terms'].apply(lambda x: spread_terms(terms_df, x))
    annos_df['qualifier'] = annos_df['qualifier'].str.replace('_', ' ')
    annos_df['evidence'] = annos_df.apply(lambda x: get_evidence(articles_df, genes_df, x),axis=1)
    annos_df['evidence_type'] = annos_df['evidence_type'].replace(np.nan, 'n/a')
    annos_df['groups'] = annos_df['evidence'].apply(lambda x: get_groups(x))
    annos_df['evidence_count'] = annos_df['evidence'].apply(lambda x: count_evidence(x))

    return annos_df


if __name__ == "__main__":
    main()
