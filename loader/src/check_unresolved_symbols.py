#!/usr/bin/env python3
"""
Script to add named_gene field to gene annotations.
Checks if gene (after removing UniProtKB: prefix) matches gene_symbol.
"""

import argparse
import json

def process_gene_entry(entry):
    """
    Add named_gene field to an existing gene entry.
    
    Args:
        entry: Dictionary containing gene information
        
    Returns:
        The same dictionary with named_gene field added
    """
    gene = entry.get("gene", "")
    gene_symbol = entry.get("gene_symbol", "")
    gene_cleaned = gene.replace("UniProtKB:", "")
    
    entry["named_gene"] = (gene_cleaned != gene_symbol)
    
    return entry


def process_file(input_path, output_path):
    """
    Process the input JSON file and write results to output file.
    
    Args:
        input_path: Path to input JSON file
        output_path: Path to output JSON file
    """
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for entry in data:
        process_gene_entry(entry)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def main():
    
    parser = argparse.ArgumentParser( )
    
    parser.add_argument( '-i', '--input', required=True)    
    parser.add_argument( '-o', '--output', required=True)    
    args = parser.parse_args()
    
    process_file(args.input, args.output)


if __name__ == "__main__":
    main()
