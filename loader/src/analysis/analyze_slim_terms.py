import argparse
import json

def main():
    parser = argparse.ArgumentParser(
        description='Count the number of distinct genes for a specified slim term.'
    )
    
    parser.add_argument('jsonFile')
    parser.add_argument('slimTerm')
    args = parser.parse_args()

    with open(args.jsonFile, 'r') as f:
        data = json.load(f)

    distinct_genes = set()

    for record in data:
        if 'slim_terms' in record and args.slimTerm in record['slim_terms']:
            distinct_genes.add(record['gene'])

    print(f"The slim term '{args.slimTerm}' appears in {len(distinct_genes)} distinct gene(s).")

if __name__ == '__main__':
    main()

# python src/analysis/analyze_slim_terms.py downloads/input/pango-1/human_iba_annotations.json 'UNKNOWN:0001'