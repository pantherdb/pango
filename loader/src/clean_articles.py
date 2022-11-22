import os
import time
import typing
import requests
from os import path as ospath
import json
import argparse
import pandas as pd
from sys import path
from src.config.base import dir_path, file_path
from src.utils import load_json


def main():
    parser = parse_arguments()
    in_dir =  parser.in_dir
    out_file =  parser.out_fp

    parse_articles(in_dir, out_file)


def parse_arguments():
    parser = argparse.ArgumentParser(description='Loads pmids',
                                     epilog='It works!')
    parser.add_argument('-i', dest='in_dir', required=True,
                        type=dir_path, help='pmids and labels file')

    parser.add_argument('-o', dest='out_fp', required=True,
                         help='Metadata')

    return parser.parse_args()

def parse_article(res):  

    article = dict()
    article['pmid'] = 'PMID:'+res['uid']
    article['title']= res['title']
    article['date'] = res['pubdate']
    if res['authors'] !=None and isinstance(res['authors'], list) :
        article['authors'] = [author['name'] for author in res['authors']]
   
    return article

def parse_articles(in_dir, out_fp):
    start_time = time.time()
    articles = list()
    for root, dirs, files in os.walk(in_dir, topdown=True):
        for name in files:
            if name.endswith('.json'):
                fp = os.path.join(root, name)
                article_file = load_json(fp)
                res = article_file['result']
                print(fp)
                article = [parse_article(res[uid]) for uid in res['uids']]
                articles.extend(article)
              
    print (len(articles))
    write_to_json(articles, ospath.join(out_fp))          
         
    print( f" processed. Total time taken {time.time() - start_time}s")


def write_to_json(json_data, output_file):
    with open(output_file, 'w', encoding='utf-8') as outfile:
        json.dump(json_data, outfile,  ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()


# python3 -m src.clean_pmids  -t ./data/pmids.json -o ./data/clean-pmids.json