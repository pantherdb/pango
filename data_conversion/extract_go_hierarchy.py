#!/usr/bin/python3
"""
Extract child-parent relationships from GO ontology for annotated terms.

Reads robot-exported GO hierarchy JSON and filters to only include terms
that appear in human_iba_annotations.json.
"""

import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(
        description='Extract GO hierarchy for annotated terms'
    )
    parser.add_argument(
        '-g', '--go-hierarchy',
        required=True,
        help='Robot-exported GO JSON with SubClassOf [ID] column'
    )
    parser.add_argument(
        '-a', '--annotations',
        required=True,
        help='human_iba_annotations.json file'
    )
    parser.add_argument(
        '-d', '--debug_indent',
        type=int,
        default=None,
        help='JSON output indentation (default: None for compact)'
    )
    args = parser.parse_args()

    # Load robot-exported GO hierarchy
    with open(args.go_hierarchy, 'r') as f:
        go_data = json.load(f)

    # Load annotations to get the set of annotated terms
    with open(args.annotations, 'r') as f:
        annotations = json.load(f)

    # Collect all unique GO terms from annotations (both term and slim_terms)
    annotated_terms = set()
    for annot in annotations:
        term = annot.get('term')
        if term and term.startswith('GO:'):
            annotated_terms.add(term)
        for slim_term in annot.get('slim_terms', []):
            if slim_term.startswith('GO:'):
                annotated_terms.add(slim_term)

    # Build hierarchy as list of child-parent objects
    hierarchy = []
    for entry in go_data:
        term_id = entry.get('ID')
        if term_id in annotated_terms:
            parents = entry.get('SubClassOf [ID]', [])
            # Filter parents to only include annotated terms
            for parent in parents:
                if parent in annotated_terms:
                    hierarchy.append({"child": term_id, "parent": parent})

    # Output as JSON (compact if no indent specified or indent is 0)
    if args.debug_indent:
        json.dump(hierarchy, sys.stdout, indent=args.debug_indent)
    else:
        json.dump(hierarchy, sys.stdout, separators=(',', ':'))
    print()  # newline at end


if __name__ == '__main__':
    main()