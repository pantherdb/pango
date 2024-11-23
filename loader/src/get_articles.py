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

pubmed_api = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id='

def main():
    parser = parse_arguments()
    annotations_fp = parser.annotations_fp
    out_fp = parser.out_fp
    existing_articles_fp = parser.existing_articles or out_fp  # Use output file as default for existing articles

    get_pubmed_metadata(annotations_fp, out_fp, existing_articles_fp)

def parse_arguments():
    parser = argparse.ArgumentParser(description='Loads pmids',
                                   epilog='It works!')
    parser.add_argument('-a', dest='annotations_fp', required=True,
                       type=file_path, help='Annotations Json (dirty one)')
    parser.add_argument('-o', dest='out_fp', required=True,
                       help='Metadata output file')
    parser.add_argument('-e', dest='existing_articles', required=False,
                       help='Existing articles JSON file (defaults to output file if not specified)')
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
    article['title'] = res.get('title', "")
    article['date'] = res.get('pubdate', None)
    if res['authors'] is not None and isinstance(res['authors'], list):
        article['authors'] = [author['name'] for author in res['authors']]
   
    return article

def load_existing_articles(file_path):
    try:
        if file_path and ospath.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
    except json.JSONDecodeError:
        print(f"Warning: Could not parse existing articles file {file_path}. Starting fresh.")
    except Exception as e:
        print(f"Warning: Error reading existing articles file {file_path}: {str(e)}. Starting fresh.")
    return []

def get_pubmed_metadata(annotations_fp, out_fp, existing_articles_fp):
    start_time = time.time()
    
    # Load existing articles
    existing_articles = load_existing_articles(existing_articles_fp)
    existing_pmids = {article['pmid'] for article in existing_articles}
    
    # Get all PMIDs from annotations
    all_pmids = [x.replace('PMID:', '') for x in get_unique_refs(annotations_fp)]
    print(f"Found {len(all_pmids)} total PMIDs in annotations")
    
    # Filter out PMIDs that already exist
    new_pmids = [pmid for pmid in all_pmids if f'PMID:{pmid}' not in existing_pmids]    
    print(f"Total PMIDs: {len(all_pmids)} (New: {len(new_pmids)}, Existing: {len(existing_pmids)})")
    
    end = len(new_pmids)
    step = 100
    
    pubmed_json = list(existing_articles)  # Start with existing articles
    
    # Only fetch new PMIDs
    if new_pmids:
        for i in range(0, end, step):
            x = i
            batch = new_pmids[x:x+step]
            time.sleep(2)
            try:
                response = requests.get(pubmed_api + ",".join(batch))
                response.raise_for_status()  # Raise an exception for bad status codes
                res = response.json()['result']
                new_articles = [parse_article(res[uid]) for uid in res['uids']]
                pubmed_json.extend(new_articles)
                print(f"Processed {min(x+step, end)}/{end} new articles")
            except Exception as e:
                print(f"Error processing batch {x}-{x+step}: {str(e)}")
                print(f"Skipping batch and continuing...")
                continue
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(out_fp), exist_ok=True)
    
    # Write to temporary file first to avoid corruption
    temp_file = out_fp + '.tmp'
    try:
        write_to_json(pubmed_json, temp_file)
        os.replace(temp_file, out_fp)  # Atomic replacement
    except Exception as e:
        print(f"Error writing output file: {str(e)}")
        if os.path.exists(temp_file):
            os.remove(temp_file)
        raise
    
    print(f"Processing complete. Total time taken {time.time() - start_time:.2f}s")
    print(f"Total articles: {len(pubmed_json)} (New: {len(new_pmids)}, Existing: {len(existing_articles)})")

def write_to_json(json_data, output_file):
    with open(output_file, 'w', encoding='utf-8') as outfile:
        json.dump(json_data, outfile, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()