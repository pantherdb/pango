import argparse
import json
from os import path as ospath
import pandas as pd
from src.config.base import file_path
from src.utils import get_pd_row, get_pd_row_key, write_to_json

def main():
    parser = parse_arguments()
    terms_df = get_terms_map(parser.terms_fp)
    articles_df = get_articles_map(parser.articles_fp)
    genes_df = get_genes_map(parser.genes_fp)
    annotations_df = get_annotations(parser.annotations_fp, terms_df, genes_df, articles_df)
    anno_json = annotations_df.to_json(orient="records", default_handler=None)
    json_str = json.loads(anno_json)

    write_to_json(json_str, ospath.join('.', parser.clean_annotations_fp))


def parse_arguments():
    parser = argparse.ArgumentParser(description='PreLoad Processing',
                                     epilog='It should probably work!')
    parser.add_argument('-a', dest='annotations_fp', required=True,
                        type=file_path, help='Annotations Json')
    parser.add_argument('-t', dest='terms_fp', required=True,
                        type=file_path, help='Terms Json')
    parser.add_argument('-art', dest='articles_fp', required=True,
                        type=file_path, help='Articles Json')
    parser.add_argument('-g', dest='genes_fp', required=True,
                        type=file_path, help='Genes Json')
    parser.add_argument('-o', dest='clean_annotations_fp', required=True,
                         help='Output of Clean Annotation')

    return parser.parse_args()

def spread_terms(df, terms):
    return [get_pd_row(df, term) for term in terms]


def get_aspect(df, k):
    row = get_pd_row_key(df, k)
    if row is None:
        return 'no' + str(k)
    aspect = row.get('aspect', None)
    return aspect

def get_evidence(df, gene_df, evidences):
    result = []
    for evidence in evidences:
        result_ref =[]
        for reference in evidence['references']:
            row = get_pd_row_key(df, reference)
            result_ref.append(row)
        gene_row = get_pd_row_key(gene_df, evidence['with_gene_id'])
        result.append({
            'with_gene_id':gene_row,
            'references':result_ref
        })
            
    return result

def get_evidence_type(row):
    for evidence in row['evidence']:
        if evidence["with_gene_id"]['gene'] == row['gene']:
            return 'direct'
            
    return 'homology'

def get_slim(row):
    for evidence in row['evidence']:
        if evidence["with_gene_id"]['gene'] == row['gene']:
            return 'direct'
            
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

# Gene
def get_genes_map(genes_fp):
    genes_df = pd.read_json(genes_fp)
    genes_df = genes_df.set_index('gene', drop=False)
    return genes_df

def get_annotations(annotations_fp, terms_df, genes_df, articles_df):

    annotations_df = pd.read_json(annotations_fp)
    annotations_df['aspect'] = annotations_df['term'].apply(lambda x: get_pd_row(terms_df, x)['aspect'])
    annotations_df['term'] = annotations_df['term'].apply(lambda x: get_pd_row(terms_df, x))
    annotations_df['slim_terms'] = annotations_df['slim_terms'].apply(lambda x: spread_terms(terms_df, x))
    annotations_df['relation'] = annotations_df['qualifiers'].apply(lambda x: x[0])
    annotations_df['relation'] = annotations_df['relation'].str.replace('_', ' ')
    annotations_df['evidence'] = annotations_df['evidence'].apply(lambda x: get_evidence(articles_df, genes_df, x))
    annotations_df['evidence_type'] = annotations_df.apply(lambda x: get_evidence_type(x), axis=1)
    annotations_df = annotations_df.drop(columns=['qualifiers'])

    return annotations_df


if __name__ == "__main__":
    main()
