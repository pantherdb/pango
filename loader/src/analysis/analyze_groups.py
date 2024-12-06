import argparse
import json
import csv
from collections import Counter
from enum import Enum, auto
from typing import Dict, List, Counter as CounterType
from pathlib import Path

class CountMethod(Enum):
    ALL = 'all'
    UNIQUE = 'unique'

class SortMethod(Enum):
    NAME = 'name'
    COUNT = 'count'    

class GroupAnalyzer:
    def __init__(self, data: List[Dict]):
        self.data = data
        
    def _process_group(self, group: str) -> str:
        """
        Process a group string, returning 'NO GROUP' for empty or None values.
        
        Args:
            group: The group string to process
            
        Returns:
            str: Processed group string or 'NO GROUP'
        """
        cleaned_group = group.strip() if group else ''
        return cleaned_group if cleaned_group else 'NO GROUP'
        
    def count_all_occurrences(self) -> CounterType:
        """
        Count every occurrence of each group in evidence.
        
        Returns:
            Counter: Frequency of each group's occurrence
        """
        group_counter = Counter()
        
        for entry in self.data:
            for evidence in entry.get('evidence', []):
                for group in evidence.get('groups', ['']):  # Default to empty list with empty string
                    split_groups = [self._process_group(g) for g in group.split(',')]
                    group_counter.update(split_groups)
        
        return group_counter
    
    def count_unique_per_entry(self) -> CounterType:
        """
        Count each group only once per entry.
        
        Returns:
            Counter: Frequency of each group's unique appearances per entry
        """
        group_counter = Counter()
        
        for entry in self.data:
            entry_groups = set()
            for evidence in entry.get('evidence', []):
                for group in evidence.get('groups', ['']):
                    split_groups = [self._process_group(g) for g in group.split(',')]
                    entry_groups.update(split_groups)
            group_counter.update(entry_groups)
        
        return group_counter

class ResultFormatter:
    @staticmethod
    def format_results(group_counts: CounterType, 
                      sort_method: SortMethod, 
                      count_method: CountMethod,
                      total_entries: int) -> str:
        """Format the analysis results into a presentable string."""
        # Sort results
        if sort_method == SortMethod.NAME:
            sorted_groups = sorted(group_counts.items())
        else:
            sorted_groups = sorted(group_counts.items(), 
                                 key=lambda x: (-x[1], x[0]))
        
        method_desc = ("counting all occurrences" if count_method == CountMethod.ALL 
                      else "counting each group once per entry")
        
        lines = [
            f"\nGroup Analysis Results ({method_desc}):",
            "-" * 60,
            f"{'Group':<40} {'Count':>10}",
            "-" * 60
        ]
        
        lines.extend(f"{group:<40} {count:>10}" for group, count in sorted_groups)
        
        lines.extend([
            "-" * 60,
            f"Total unique groups: {len(group_counts)}",
            f"Total entries analyzed: {total_entries}"
        ])
        
        return "\n".join(lines)

    @staticmethod
    def save_to_csv(group_counts: CounterType, 
                    output_file: str,
                    sort_method: SortMethod):
        """
        Save results to a CSV file.
        
        Args:
            group_counts: Counter object with group frequencies
            output_file: Path to output CSV file
            sort_method: Method used for sorting results
        """
        if sort_method == SortMethod.NAME:
            sorted_groups = sorted(group_counts.items())
        else:
            sorted_groups = sorted(group_counts.items(), 
                                 key=lambda x: (-x[1], x[0]))
            
        with open(output_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Group', 'Count'])  # Header
            writer.writerows(sorted_groups)

def parse_arguments() -> argparse.Namespace:
    
    parser = argparse.ArgumentParser(
        description='Analyze group frequencies in JSON data',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    parser.add_argument('input_file',
                       help='Path to input JSON file')
    
    parser.add_argument('--count-method', '-m',
                       type=CountMethod,
                       choices=list(CountMethod),
                       default=CountMethod.ALL,
                       help='Method for counting group occurrences')
    
    parser.add_argument('--sort', '-s',
                       type=SortMethod,
                       choices=list(SortMethod),
                       default=SortMethod.COUNT,
                       help='Method for sorting results')
    
    parser.add_argument('--output', '-o',
                       help='Output CSV file path')

    return parser.parse_args()

def main():
    args = parse_arguments()
    
    try:        
        with open(args.input_file, 'r') as f:
            data = json.load(f)
        
        analyzer = GroupAnalyzer(data)
        
        count_function = (analyzer.count_all_occurrences 
                         if args.count_method == CountMethod.ALL 
                         else analyzer.count_unique_per_entry)
        group_counts = count_function()
        
        result_formatter = ResultFormatter()
        output = result_formatter.format_results(
            group_counts=group_counts,
            sort_method=args.sort,
            count_method=args.count_method,
            total_entries=len(data)
        )
        print(output)
        
        if args.output:
            output_path = Path(args.output)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            result_formatter.save_to_csv(
                group_counts=group_counts,
                output_file=str(output_path),
                sort_method=args.sort
            )
            print(f"\nResults saved to: {output_path}")
        
    except FileNotFoundError:
        print(f"Error: File '{args.input_file}' not found")
    except json.JSONDecodeError:
        print(f"Error: '{args.input_file}' is not a valid JSON file")
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        raise

if __name__ == "__main__":
    main()