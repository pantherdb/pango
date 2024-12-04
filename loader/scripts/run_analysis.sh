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
    
    annotations_file="${input_folder}/human_iba_annotations.json"
    gene_info_file="${input_folder}/human_iba_gene_info.json"
    
    # Check if required files exist
    if [ ! -f "$annotations_file" ]; then
        echo "Error: Annotations file not found in $folder_name: $annotations_file"
        exit 1
    fi

    if [ ! -f "$gene_info_file" ]; then
        echo "Error: Gene info file not found in $folder_name: $gene_info_file"
        exit 1
    fi
    
    # Create output directory
    mkdir -p "${output_dir}/${folder_name}"
    
    echo "Processing ${folder_name}..."
    
    # Process groups
    echo "  Running group analysis..."
    echo "    All groups..."
    python src/analysis/analyze_groups.py \
        "$annotations_file" \
        -m all \
        -o "${output_dir}/${folder_name}/all-groups.csv"
    
    echo "    Unique groups..."
    python src/analysis/analyze_groups.py \
        "$annotations_file" \
        -m unique \
        -o "${output_dir}/${folder_name}/unique-groups.csv"
    
    # Process genes
    echo "  Running gene analysis..."
    python src/analysis/analyze_genes.py \
        -i "$annotations_file" \
        -g "$gene_info_file" \
        -o "${output_dir}/${folder_name}/gene_count.csv" \
        -s count
    
    echo "  Done with ${folder_name}"
done

echo -e "\nAnalysis complete. Results saved in $output_dir"