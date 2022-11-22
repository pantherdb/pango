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

class Article() :
  id: str
  title: str
  author: str
  date: str


def main():
    parser = parse_arguments()
    annotations_fp =  parser.annotations_fp
    out_dir =  parser.out_dir

    Path(out_dir).mkdir(parents=True, exist_ok=True)    

    get_pubmed_metadata(annotations_fp, out_dir)


def parse_arguments():
    parser = argparse.ArgumentParser(description='Loads pmids',
                                     epilog='It works!')
    parser.add_argument('-a', dest='annotations_fp', required=True,
                        type=file_path, help='Annotations Json (dirty one)')

    parser.add_argument('-o', dest='out_dir', required=True,
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


def get_pubmed_metadata(annotations_fp: path, out_dir):

    start_time = time.time()
    pmids =[x.replace('PMID:', '') for x in get_unique_refs(annotations_fp)]
    end = len(pmids)
    step = 100
    count = 1
    for i in range(0, end, step):
        x = i
        time.sleep(2)
        response = requests.get(pubmed_api+",".join(pmids[x:x+step]))
        pubmed_json = response.json()
        write_to_json(pubmed_json, ospath.join(out_dir, f"articles-{count}.json"))
        count+=1
        
    print( f" processed. Total time taken {time.time() - start_time}s")



def write_to_json(json_data, output_file):
    with open(output_file, 'w', encoding='utf-8') as outfile:
        json.dump(json_data, outfile,  ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()


# python3 -m src.get_articles_everything -a ./downloads/human_iba_annotations.json -o ./downloads/articles/