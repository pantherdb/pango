#!/usr/bin/env python3
import argparse
import sys
import re


parser = argparse.ArgumentParser(description='Process GAF file to create functionome release format')
parser.add_argument('input_file', help='Input GAF file (gene_association.paint_human.gaf)')
parser.add_argument('output_file', help='Output GAF file (functionome_release.gaf)')


def process_gaf_file(input_file, output_file):
    """
    Group GAF lines by columns 1-7, 9-17 and PANTHER:PTN part of column 8.
    Collect all gene IDs following the PTN and collapse them into column 8.
    """
    groups = {}  # key -> set of gene IDs
    header_lines = []

    with open(input_file, 'r') as f:
        for line in f:
            line = line.strip()

            # Collect header lines (comments starting with !)
            if line.startswith('!'):
                header_lines.append(line)
                continue

            # Skip empty lines
            if not line:
                continue

            fields = line.split('\t')

            # Require at least 17 columns
            if len(fields) < 17:
                continue

            # Keep only first 17 columns
            fields = fields[:17]

            col8 = fields[7]

            # Find PANTHER:PTN pattern and extract gene IDs
            ptn_pattern = None
            gene_ids = set()

            # Split by whitespace and process each token
            tokens = col8.split()
            for token in tokens:
                if token.startswith('PANTHER:PTN'):
                    # Split by | to separate PTN from gene IDs
                    parts = token.split('|')
                    ptn_pattern = parts[0]  # PANTHER:PTN... part
                    # Collect gene IDs (everything after the first |)
                    for part in parts[1:]:
                        if part.strip():
                            gene_ids.add(part.strip())

            # Skip lines without PANTHER:PTN pattern
            if not ptn_pattern:
                continue

            # Create grouping key: cols 1-7, PTN pattern, cols 9-17
            key = tuple(fields[0:7]) + (ptn_pattern,) + tuple(fields[8:17])

            if key not in groups:
                groups[key] = set()

            groups[key].update(gene_ids)

    # Generate output lines
    output_lines = []
    for key, gene_ids in groups.items():
        # Reconstruct fields: cols 1-7, collapsed col 8, cols 9-17
        cols_1_7 = list(key[0:7])
        ptn_pattern = key[7]
        cols_9_17 = list(key[8:])

        # Build collapsed column 8: PTN|gene_id1|gene_id2|...
        sorted_gene_ids = sorted(gene_ids)
        if sorted_gene_ids:
            col8_collapsed = ptn_pattern + '|' + '|'.join(sorted_gene_ids)
        else:
            col8_collapsed = ptn_pattern

        output_fields = cols_1_7 + [col8_collapsed] + cols_9_17
        output_lines.append('\t'.join(output_fields))

    # Read additional GAF file lines
    additional_lines = []
    additional_gaf_file = 'resources/annot_human_genes_not_in_families_selected.gaf'
    try:
        with open(additional_gaf_file, 'r') as f:
            for line in f:
                line = line.strip()
                # Skip comments and empty lines
                if line and not line.startswith('!'):
                    additional_lines.append(line)
    except FileNotFoundError:
        # File doesn't exist, continue without it
        pass

    # Write output with header, sorted grouped lines, then additional lines
    with open(output_file, 'w') as f:
        # Write header lines
        for header_line in header_lines:
            f.write(header_line + '\n')

        # Write sorted grouped lines
        for line in sorted(output_lines):
            f.write(line + '\n')

        # Write additional lines
        for line in additional_lines:
            f.write(line + '\n')


if __name__ == '__main__':

    args = parser.parse_args()

    try:
        process_gaf_file(args.input_file, args.output_file)
        print(f"Successfully processed {args.input_file} -> {args.output_file}")
    except FileNotFoundError:
        print(f"Error: Input file {args.input_file} not found", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error processing file: {e}", file=sys.stderr)
        sys.exit(1)