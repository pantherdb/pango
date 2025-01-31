#!/bin/bash

set -e

INPUT_BASE=""
OUTPUT_DIR=""
CLEAN_ARTICLES=""
SAMPLE_SIZE=10

usage() {
    echo "Usage: $0 -i <input_folder_path> -o <output_dir> -a <clean_articles_path> [-n <sample_size>]"
    exit 1
}

while getopts "i:o:a:n:" opt; do
    case $opt in
        i) INPUT_BASE="$OPTARG" ;;
        o) OUTPUT_DIR="$OPTARG" ;;
        a) CLEAN_ARTICLES="$OPTARG" ;;
        n) SAMPLE_SIZE="$OPTARG" ;;
        \?) usage ;;
        :) usage ;;
    esac
done

[[ -z "$INPUT_BASE" || -z "$OUTPUT_DIR" || -z "$CLEAN_ARTICLES" ]] && usage

[[ ! -f "$CLEAN_ARTICLES" ]] && echo "[]" > "$CLEAN_ARTICLES"

extract_samples() {
    local input_dir="$1"
    local output_subdir="$OUTPUT_DIR/$(basename "$input_dir")"
    
    local terms_fp="$input_dir/full_go_annotated.json"
    local annotations_fp="$input_dir/human_iba_annotations.json"
    local genes_fp="$input_dir/human_iba_gene_info.json"
    local taxon_fp="$input_dir/taxon_lkp.json"
    
    [[ ! -f "$terms_fp" || ! -f "$annotations_fp" || ! -f "$genes_fp" || ! -f "$taxon_fp" ]] && return 1
    
    mkdir -p "$output_subdir"
    
    python3 -m src.extract_sample_data \
        -a "$annotations_fp" \
        -t "$terms_fp" \
        -art "$CLEAN_ARTICLES" \
        -tax "$taxon_fp" \
        -g "$genes_fp" \
        -n "$SAMPLE_SIZE" \
        -o "$output_subdir"
}

[[ ! -d "$INPUT_BASE" ]] && echo "Input directory not found: $INPUT_BASE" && exit 1

found_folders=false
while IFS= read -r folder; do
    if [[ -d "$folder" && "$folder" != "$INPUT_BASE" ]]; then
        found_folders=true
        extract_samples "$folder"
    fi
done < <(find "$INPUT_BASE" -mindepth 1 -maxdepth 1 -type d)

[[ "$found_folders" = false ]] && echo "No folders found in $INPUT_BASE" && exit 1

echo "Samples extracted to $OUTPUT_DIR"

bash scripts/extract_sample_data.sh  -i ./downloads/input -a ./downloads/clean-articles.json