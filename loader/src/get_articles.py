import os
from pathlib import Path
import time
import requests
from os import path as ospath
import json
import argparse
import pandas as pd
from sys import path
from src.config.base import file_path
from src.utils import load_json

pubmed_api= 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id='


def main():
    parser = parse_arguments()
    annotations_fp =  parser.annotations_fp
    out_fp =  parser.out_fp

    get_pubmed_metadata(annotations_fp, out_fp)


def parse_arguments():
    parser = argparse.ArgumentParser(description='Loads pmids',
                                     epilog='It works!')
    parser.add_argument('-a', dest='annotations_fp', required=True,
                        type=file_path, help='Annotations Json (dirty one)')

    parser.add_argument('-o', dest='out_fp', required=True,
                         help='Metadata')

    return parser.parse_args()


def get_unique_refs(annotations_fp):
    refs = set()
    annotations_df = pd.read_json(annotations_fp)    
        
    for evidences in list(annotations_df['evidence']):
        for evidence in evidences:
            for ref in evidence['references']:
                refs.add(ref)
            
    return list(refs)

def parse_article(res):      

    article = dict()
    article['pmid'] = 'PMID:'+res['uid']
    article['title']= res.get('title', "")
    article['date'] = res.get('pubdate', None)
    if res['authors'] !=None and isinstance(res['authors'], list) :
        article['authors'] = [author['name'] for author in res['authors']]
   
    return article


def get_pubmed_metadata(annotations_fp: path, out_fp):

    start_time = time.time()
    pmids =[x.replace('PMID:', '') for x in get_unique_refs(annotations_fp)]
    end = len(pmids)
    step = 100

    pubmed_json = list()
    for i in range(0, end, step):
        x = i
        time.sleep(1)
        response = requests.get(pubmed_api+",".join(pmids[x:x+step]))
        res = response.json()['result']
        pubmed_json.extend([parse_article(res[uid]) for uid in res['uids']])
        
    write_to_json(pubmed_json, ospath.join(out_fp))
        
        
    print( f" processed. Total time taken {time.time() - start_time}s")



def write_to_json(json_data, output_file):
    with open(output_file, 'w', encoding='utf-8') as outfile:
        json.dump(json_data, outfile,  ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()


# python3 -m src.get_articles -a ./downloads/human_iba_annotations.json -o ./downloads/articles2.json