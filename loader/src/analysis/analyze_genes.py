import argparse
import json
from collections import Counter
from pathlib import Path
import pandas as pd
from typing import Dict, List, Counter as CounterType, Set
from enum import Enum

UNKNOWN_TERMS = ['UNKNOWN:0001', 'UNKNOWN:0002', 'UNKNOWN:0003']

class SortColumn(Enum):
    GENE = 'gene'
    GENE_SYMBOL = 'gene_symbol'
    GENE_NAME = 'gene_name'
    COUNT = 'count'
    
    def __str__(self):
        return self.value

class GeneAnalyzer:
    def __init__(self, data: List[Dict], gene_lookup: pd.DataFrame):
        self.data = data
        self.gene_lookup = gene_lookup
        
        self.valid_genes: Set[str] = set(gene_lookup['gene'].values)
        
    def count_genes(self) -> Counter:
        gene_counter = Counter()
        skipped_count = 0
        unknown_term_set = set(UNKNOWN_TERMS) 
        
        # Pre-allocate lists for batch processing
        genes_to_process = []
        
        for entry in self.data:
            if entry.get('term') in unknown_term_set:
                skipped_count += 1
                continue
                
            gene = entry.get('gene')
            if not gene:
                raise ValueError(f"Entry missing gene field: {entry}") # unlikely
                
            if gene not in self.valid_genes:
                raise ValueError(f"Gene {gene} not found in lookup file")
            
            genes_to_process.append(gene)
        
        gene_counter.update(genes_to_process)
        
        if skipped_count > 0:
            print(f"Skipped {skipped_count} entries with unknown terms")
            
        return gene_counter
    
    def create_report(self, counts: Counter, sort_by: SortColumn, ascending: bool = True) -> pd.DataFrame:
        
        # Still working on creating DataFrame efficiently
        df = pd.DataFrame(list(counts.items()), columns=['gene', 'count'])
        
        if not self.gene_lookup.index.name == 'gene':
            self.gene_lookup.set_index('gene', inplace=True)
            
        df = df.join(
            self.gene_lookup[['gene_symbol', 'gene_name']], 
            on='gene'
        )
        
        df = df[['gene', 'gene_symbol', 'gene_name', 'count']].sort_values(
            by=sort_by.value, 
            ascending=ascending
        )
        
        return df

def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Analyze gene counts in annotations',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
   
    parser.add_argument('-i', '--input_file',
                       required=True,
                       help='Path to annotations JSON file')
   
    parser.add_argument('-g', '--gene_file',
                       required=True,
                       help='Path to gene lookup JSON file')
   
    parser.add_argument('-o', '--output_file',
                       required=True,
                       help='Output CSV file path')
    
    parser.add_argument('-s', '--sort_by',
                       type=SortColumn,
                       choices=list(SortColumn),
                       default=SortColumn.COUNT,
                       help='Column to sort by')
    
    parser.add_argument('--ascending',
                       action='store_true',
                       help='Sort in ascending order (default is descending for count, ascending for others)')

    return parser.parse_args()

def main():
    args = parse_arguments()
    
    try:
        with open(args.input_file, 'r') as f:
            annotations_data = json.load(f)
            
        gene_lookup = pd.read_json(args.gene_file)
        
        analyzer = GeneAnalyzer(annotations_data, gene_lookup)
        counts = analyzer.count_genes()
                
        ascending = args.ascending if args.ascending else (args.sort_by != SortColumn.COUNT)
        
        report_df = analyzer.create_report(
            counts, 
            sort_by=args.sort_by, 
            ascending=ascending
        )
        
        output_path = Path(args.output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        report_df.to_csv(output_path, index=False)
        
        print(f"\nProcessed {len(annotations_data)} annotations")
        print(f"Found {len(report_df)} unique genes")
        print(f"Sorted by: {args.sort_by} ({'ascending' if ascending else 'descending'})")
        print(f"Results saved to: {output_path}")
        
    except FileNotFoundError as e:
        print(f"Error: File not found - {e}")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON file - {e}")
    except ValueError as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise

if __name__ == "__main__":
    main()