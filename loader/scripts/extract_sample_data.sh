#!/bin/bash

set -e

INPUT_BASE=""
CLEAN_ARTICLES=""
SAMPLE_SIZE=10
OUTPUT_DIR=""

usage() {
    echo "Usage: $0 -i <input_folder_path> -a <clean_articles_path> -o <output_dir> [-n <sample_size>]"
    exit 1
}

while getopts "i:a:n:o:" opt; do
    case $opt in
        i) INPUT_BASE="$OPTARG" ;;
        a) CLEAN_ARTICLES="$OPTARG" ;;
        n) SAMPLE_SIZE="$OPTARG" ;;
        o) OUTPUT_DIR="$OPTARG" ;;
        \?) usage ;;
        :) usage ;;
    esac
done

[[ -z "$INPUT_BASE" || -z "$CLEAN_ARTICLES" || -z "$OUTPUT_DIR" ]] && usage

[[ ! -d "$INPUT_BASE" ]] && echo "Input directory not found: $INPUT_BASE" && exit 1
mkdir -p "$OUTPUT_DIR"

TERMS_FP="$INPUT_BASE/full_go_annotated.json"
ANNOTATIONS_FP="$INPUT_BASE/human_iba_annotations.json"
GENES_FP="$INPUT_BASE/human_iba_gene_info.json"
TAXON_FP="$INPUT_BASE/taxon_lkp.json"

for file in "$TERMS_FP" "$ANNOTATIONS_FP" "$GENES_FP" "$TAXON_FP"; do
    if [[ ! -f "$file" ]]; then
        echo "Required file not found: $file"
        exit 1
    fi
done

[[ ! -f "$CLEAN_ARTICLES" ]] && echo "[]" > "$CLEAN_ARTICLES"

python3 -m src.extract_sample_data \
    -a "$ANNOTATIONS_FP" \
    -t "$TERMS_FP" \
    -art "$CLEAN_ARTICLES" \
    -tax "$TAXON_FP" \
    -g "$GENES_FP" \
    -n "$SAMPLE_SIZE" \
    -o "$OUTPUT_DIR"

echo "Samples extracted to $OUTPUT_DIR"