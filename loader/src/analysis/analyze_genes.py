import argparse
import json
from collections import Counter
from pathlib import Path
import pandas as pd
from typing import Dict, List, Counter as CounterType

class GeneAnalyzer:
    def __init__(self, data: List[Dict], gene_lookup: pd.DataFrame):
        self.data = data
        self.gene_lookup = gene_lookup
        
    def count_genes(self) -> Counter:
        gene_counter = Counter()
        
        for entry in self.data:
            gene = entry.get('gene')
            if not gene:
                raise ValueError(f"Entry missing gene field: {entry}")
                
            gene_counter[gene] += 1
            
            if gene not in self.gene_lookup['gene'].values:
                raise ValueError(f"Gene {gene} not found in lookup file")
        
        return gene_counter
    
    def create_report(self, counts: Counter, sort_by: str, ascending: bool = True) -> pd.DataFrame:
        """Create a DataFrame with gene counts and lookup information."""
        df = pd.DataFrame({
            'gene': list(counts.keys()),
            'count': list(counts.values())
        })
        
        df = df.merge(
            self.gene_lookup[['gene', 'gene_symbol', 'gene_name']], 
            on='gene', 
            how='left'
        )
        
        df = df[['gene', 'gene_symbol', 'gene_name', 'count']].sort_values(
            by=sort_by, 
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
                       choices=['gene', 'gene_symbol', 'gene_name', 'count'],
                       default='count',
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
                
        ascending = args.ascending if args.ascending else (args.sort_by != 'count')
        
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