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
    pmids_file =  parser.pmids_fp
    out_file =  parser.out_fp

    load_pmids(pmids_file, out_file)


def parse_arguments():
    parser = argparse.ArgumentParser(description='Loads pmids',
                                     epilog='It works!')
    parser.add_argument('-p', dest='pmids_fp', required=True,
                        type=file_path, help='pmid Ids and labels file')

    parser.add_argument('-o', dest='out_fp', required=True,
                         help='Metadata')

    return parser.parse_args()


def load_pmids(fp: path, out_fp: path):

    start_time = time.time()
    pmids = load_json(fp)
    res = []
    [res.append(x.replace('PMID:', '')) for x in pmids if x not in res]

    end = len(res)
    step = 250
    count = 1
    for i in range(0, end, step):
        x = i
        #print(len(res[x:x+step]), res[x:x+step][:5])
        time.sleep(2)
        response = requests.get(pubmed_api+",".join(res[x:x+step]))
        pubmed_json = response.json()
        write_to_json(pubmed_json, ospath.join(out_fp, f"articles-{count}.json"))
        count+=1
    

    
    print( f" processed. Total time taken {time.time() - start_time}s")



def write_to_json(json_data, output_file):
    with open(output_file, 'w', encoding='utf-8') as outfile:
        json.dump(json_data, outfile,  ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()


# python3 -m src.get_articles  -p ./data/filtered_refs.json -o ./downloads/articles/