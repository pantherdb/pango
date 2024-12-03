#!/bin/bash

set -e

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <input_dir> <output_dir>"
    echo "Example: $0 downloads/input downloads/analysis"
    exit 1
fi

input_dir="$1"
output_dir="$2"

# Process each subfolder in input directory
for input_folder in "$input_dir"/*/ ; do
    if [ ! -d "$input_folder" ]; then
        continue
    fi

    folder_name=$(basename "$input_folder")
    
    input_file="${input_folder}/human_iba_annotations.json"
    
    # Create output directory
    mkdir -p "${output_dir}/${folder_name}"
    
    echo "Processing ${folder_name}..."
    
    echo "  Running all analysis..."
    python src/analysis/analyze_groups.py \
        "$input_file" \
        -m all \
        -o "${output_dir}/${folder_name}/all-groups.csv"
    
    echo "  Running unique analysis..."
    python src/analysis/analyze_groups.py \
        "$input_file" \
        -m unique \
        -o "${output_dir}/${folder_name}/unique-groups.csv"
    
    echo "  Done with ${folder_name}"
done

echo -e "\nAnalysis complete. Results saved in $output_dir"