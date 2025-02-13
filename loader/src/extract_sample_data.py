import json
import random
import pandas as pd
from pathlib import Path
import argparse
from typing import Dict, List, Set

def file_path(path):
    if Path(path).is_file():
        return path
    raise argparse.ArgumentTypeError(f"File {path} does not exist")

def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('-a', dest='annos_fp', required=True, type=file_path)
    parser.add_argument('-t', dest='terms_fp', required=True, type=file_path)
    parser.add_argument('-art', dest='articles_fp', required=True, type=file_path)
    parser.add_argument('-tax', dest='taxon_fp', required=True, type=file_path)
    parser.add_argument('-g', dest='genes_fp', required=True, type=file_path)
    parser.add_argument('-o', dest='output_folder', required=True)
    parser.add_argument('-n', dest='sample_size', type=int, default=5)
    return parser.parse_args()

def load_json_file(filepath: str) -> List[Dict]:
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json_file(data: List[Dict], filepath: str):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

def collect_referenced_entities(annotations: List[Dict]) -> Dict[str, Set]:
    """
    Collect all referenced entities from annotations
    """
    references = {
        'genes': set(),
        'terms': set(),
        'articles': set(),
        'taxons': set(),
        'with_genes': set()
    }
    
    for anno in annotations:
        references['genes'].add(anno['gene'])        
        references['terms'].add(anno['term'])
        
        if 'slim_terms' in anno:
            references['terms'].update(anno['slim_terms'])        
            
        if 'evidence' in anno:
            for evidence in anno['evidence']:
                if 'with_gene_id' in evidence:
                    references['with_genes'].add(evidence['with_gene_id'])
                if 'references' in evidence:
                    references['articles'].update(evidence['references'])
                    
    return references

def validate_references(references: Dict[str, Set], lookup_data: Dict[str, List[Dict]]) -> bool:
    """
    Validate that all referenced entities exist in lookup files
    """
    genes_lookup = {g['gene'] for g in lookup_data['genes']}
    terms_lookup = {t['ID'] for t in lookup_data['terms']}
    articles_lookup = {a['pmid'] for a in lookup_data['articles']}
    
    # Validate genes
    missing_genes = references['genes'] - genes_lookup
    if missing_genes:
        print(f"Missing genes: {missing_genes}")
        return False
        
    # Validate terms
    missing_terms = references['terms'] - terms_lookup
    if missing_terms:
        print(f"Missing terms: {missing_terms}")
        return False
        
    # Validate articles
    """     missing_articles = references['articles'] - articles_lookup
    if missing_articles:
        print(f"Missing articles: {missing_articles}")
        return False """
        
    return True

def filter_lookup_data(references: Dict[str, Set], lookup_data: Dict[str, List[Dict]]) -> Dict[str, List[Dict]]:

    filtered_data = {}
    
    # Filter genes
    filtered_data['genes'] = [
        g for g in lookup_data['genes']
        if g['gene'] in references['genes'] or g['gene'] in references['with_genes']
    ]
    
    filtered_data['terms'] = [
        t for t in lookup_data['terms']
        if t['ID'] in references['terms']
    ]
    
    filtered_data['articles'] = [
        a for a in lookup_data['articles']
        if a['pmid'] in references['articles']
    ]
    
    # Filter taxons - based on the genes that were selected
    gene_taxons = {g['taxon_id'] for g in filtered_data['genes']}
    filtered_data['taxons'] = [
        t for t in lookup_data['taxons']
        if t['taxon_id'] in gene_taxons
    ]
    
    return filtered_data

def main():
    args = parse_arguments()
    
    Path(args.output_folder).mkdir(parents=True, exist_ok=True)
    
    lookup_data = {
        'annotations': load_json_file(args.annos_fp),
        'terms': load_json_file(args.terms_fp),
        'articles': load_json_file(args.articles_fp),
        'taxons': load_json_file(args.taxon_fp),
        'genes': load_json_file(args.genes_fp)
    }
    
    annos_df = pd.DataFrame(lookup_data['annotations'])
    
    unique_genes = list(annos_df['gene'].unique())
    sample_size = min(args.sample_size, len(unique_genes))  
    sampled_genes = random.sample(unique_genes, sample_size)    
    sampled_annotations = annos_df[annos_df['gene'].isin(sampled_genes)].to_dict('records')    
    references = collect_referenced_entities(sampled_annotations)
    if not validate_references(references, lookup_data):
        print("Validation failed. Exiting.")
        return
    
    filtered_data = filter_lookup_data(references, lookup_data)
    
    save_json_file(sampled_annotations, f"{args.output_folder}/annotations.json")
    save_json_file(filtered_data['terms'], f"{args.output_folder}/terms.json")
    save_json_file(filtered_data['articles'], f"{args.output_folder}/articles.json")
    save_json_file(filtered_data['taxons'], f"{args.output_folder}/taxon.json")
    save_json_file(filtered_data['genes'], f"{args.output_folder}/genes.json")
    
    print(f"Successfully sampled data for {len(sampled_genes)} genes")
    print(f"Generated files in {args.output_folder}:")
    print(f"- annotations.json: {len(sampled_annotations)} annotations")
    print(f"- terms.json: {len(filtered_data['terms'])} terms")
    print(f"- articles.json: {len(filtered_data['articles'])} articles")
    print(f"- taxon.json: {len(filtered_data['taxons'])} taxons")
    print(f"- genes.json: {len(filtered_data['genes'])} genes")

if __name__ == "__main__":
    main()