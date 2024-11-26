#!/bin/bash

set -e

# Default values
INPUT_BASE=""

# Function to display usage
usage() {
    echo "Usage: $0 -i <input_folder_path>"
    echo "Example: $0 -i ./downloads/input"
    exit 1
}

# Parse named arguments
while getopts "i:" opt; do
    case $opt in
        i)
            INPUT_BASE="$OPTARG"
            ;;
        \?)
            echo "Invalid option: -$OPTARG"
            usage
            ;;
        :)
            echo "Option -$OPTARG requires an argument"
            usage
            ;;
    esac
done

# Verify required arguments are provided
if [[ -z "$INPUT_BASE" ]]; then
    echo "Error: Input folder (-i) is required"
    usage
fi

# Function to process a single dataset
process_dataset() {
    local folder="$1"
    local prefix="$(basename "$folder")"
    
    echo "Processing dataset in folder: $prefix"
    
    # Input files for ES indexing
    local clean_annotations_fp="$folder/human_iba_annotations_clean.json"
    local genes_annotations_fp="$folder/human_iba_genes_clean.json"
    
    # Verify required input files exist
    if [[ ! -f "$clean_annotations_fp" ]]; then
        echo "Error: Clean annotations file not found: $clean_annotations_fp"
        return 1
    fi
    if [[ ! -f "$genes_annotations_fp" ]]; then
        echo "Error: Genes annotations file not found: $genes_annotations_fp"
        return 1
    fi
    
    echo "Starting ES indexing for $prefix..."
    
    python3 -m src.index_es \
        -a "$clean_annotations_fp" \
        -g "$genes_annotations_fp" \
        -p "${prefix}"
    
    echo "Completed indexing for $prefix"
    echo "----------------------------------------"
}

# Main execution
echo "Starting ES indexing pipeline..."

# Check if input directory exists
if [[ ! -d "$INPUT_BASE" ]]; then
    echo "Error: Input directory '$INPUT_BASE' not found!"
    exit 1
fi

# Debug: Show what's in the directory
echo "Contents of $INPUT_BASE:"
ls -la "$INPUT_BASE"

# Find and process each folder
found_folders=false
while IFS= read -r folder; do
    if [[ -d "$folder" && "$folder" != "$INPUT_BASE" ]]; then
        found_folders=true
        echo "Found folder: $folder"
        process_dataset "$folder"
    fi
done < <(find "$INPUT_BASE" -mindepth 1 -maxdepth 1 -type d)

if [[ "$found_folders" = false ]]; then
    echo "No folders found in $INPUT_BASE"
    exit 1
fi

echo "All folders indexed successfully!"