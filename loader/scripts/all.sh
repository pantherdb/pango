#!/bin/bash

set -e

# Default values
INPUT_BASE=""
CLEAN_ARTICLES=""
OUTPUT_DIR=""

# Function to display usage
usage() {
    echo "Usage: $0 -i <input_folder_path> -a <clean_articles_path> -o <output_dir> [-s]
    -s: Silent mode (delete output directory without prompting)"
    echo "Example: $0 -i ./downloads/input -a ./downloads/clean-articles.json -o ./downloads/output"
    exit 1
}

# Parse named arguments
while getopts "i:a:o:s" opt; do
    case $opt in
        i)
            INPUT_BASE="$OPTARG"
            ;;
        a)
            CLEAN_ARTICLES="$OPTARG"
            ;;
        o)
            OUTPUT_DIR="$OPTARG"
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
if [[ -z "$INPUT_BASE" ]] || [[ -z "$CLEAN_ARTICLES" ]] || [[ -z "$OUTPUT_DIR" ]]; then
    echo "Error: Input folder (-i), clean articles path (-a), and output directory (-o) are required"
    usage
fi

if [[ ! -f "$CLEAN_ARTICLES" ]]; then
    echo "Warning: Clean articles file not found: $CLEAN_ARTICLES"
    echo "Creating empty clean articles file..."
    echo "[]" > "$CLEAN_ARTICLES"
    echo "Created empty clean articles file at: $CLEAN_ARTICLES"
fi

# Handle output directory
if [[ -d "$OUTPUT_DIR" ]]; then
    if [[ "$*" == *"-s"* ]]; then
        rm -rf "$OUTPUT_DIR"
        mkdir -p "$OUTPUT_DIR"
    else
        read -p "Output directory exists. Delete and continue? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$OUTPUT_DIR"
            mkdir -p "$OUTPUT_DIR"
        else
            echo "Operation cancelled"
            exit 1
        fi
    fi
else
    mkdir -p "$OUTPUT_DIR"
fi

process_dataset() {
    local folder="$1"
    local prefix="$(basename "$folder")"
    
    # Create output subdirectory
    local output_subdir="$OUTPUT_DIR/$prefix"
    mkdir -p "$output_subdir"
    
    echo "Processing dataset in folder: $prefix"
    # The steps' build records name the dataset from this.
    export PANGO_DATASET="$prefix"

    # Input files - located within each folder
    local terms_fp="$folder/full_go_annotated.json"
    local annotations_fp="$folder/human_iba_annotations.json"
    local genes_fp="$folder/human_iba_gene_info.json"
    local taxon_fp="$folder/taxon_lkp.json"
    local hierarchy_fp="$folder/go_hierarchy.json"
    
    # Output files in the output subdirectory
    local clean_annotations_fp="$output_subdir/human_iba_annotations_clean.json"
    local genes_annotations_fp="$output_subdir/human_iba_genes_clean.json"
    
    echo "Using input files from $folder:"
    echo "Terms: $terms_fp"
    echo "Annotations: $annotations_fp"
    echo "Genes: $genes_fp"
    echo "Taxon: $taxon_fp"
    echo "Hierarchy: $hierarchy_fp"
    echo "Clean Articles: $CLEAN_ARTICLES"
    
    # Verify required input files exist
    if [[ ! -f "$terms_fp" ]]; then
        echo "Error: Terms file not found: $terms_fp"
        return 1
    fi
    if [[ ! -f "$annotations_fp" ]]; then
        echo "Error: Annotations file not found: $annotations_fp"
        return 1
    fi
    if [[ ! -f "$genes_fp" ]]; then
        echo "Error: Genes file not found: $genes_fp"
        return 1
    fi
    if [[ ! -f "$taxon_fp" ]]; then
        echo "Error: Taxon file not found: $taxon_fp"
        return 1
    fi
    if [[ ! -f "$hierarchy_fp" ]]; then
        echo "Error: Hierarchy file not found: $hierarchy_fp"
        return 1
    fi

    echo "Starting processing pipeline for $prefix..."
    
    echo "Getting articles..."
    python -m src.get_articles \
        -a "$annotations_fp" \
        -o "$CLEAN_ARTICLES" \
        -e "$CLEAN_ARTICLES"
    
    echo "Cleaning annotations..."
    python -m src.clean_annotations \
        -a "$annotations_fp" \
        -t "$terms_fp" \
        -tax "$taxon_fp" \
        -art "$CLEAN_ARTICLES" \
        -g "$genes_fp" \
        -o "$clean_annotations_fp"
       
    echo "Generating gene annotations..."
    python -m src.generate_gene_annotations \
        -a "$clean_annotations_fp" \
        -o "$genes_annotations_fp" \
        -hi "$hierarchy_fp"

    echo "Reporting on the data..."
    python -m src.data_report \
        -i "$folder" \
        -o "$output_subdir" \
        -art "$CLEAN_ARTICLES"

    echo "Indexing to Elasticsearch..."
    python -m src.index_es \
        -a "$clean_annotations_fp" \
        -g "$genes_annotations_fp" \
        -p "${prefix}"

    echo "Checking Elasticsearch..."
    python -m src.verify_es \
        -a "$clean_annotations_fp" \
        -g "$genes_annotations_fp" \
        -p "${prefix}"

    echo "Completed processing for $prefix"
    echo "----------------------------------------"
}

echo "Starting data processing pipeline..."

if [[ ! -d "$INPUT_BASE" ]]; then
    echo "Error: Input directory '$INPUT_BASE' not found!"
    exit 1
fi

echo "Contents of $INPUT_BASE:"
ls -la "$INPUT_BASE"

# Build record (src/build_record, read by build-dashboard/): build.json now, closed by the
# trap however the script ends. PANGO_RECORD=0 turns it off; it never stops the build.
PANGO_BUILD_ID="$(python -m src.build_record begin --script all -i "$INPUT_BASE" -a "$CLEAN_ARTICLES" -o "$OUTPUT_DIR" || true)"
export PANGO_BUILD_ID
end_build() {
    local status=$?
    python -m src.build_record end --build-id "$PANGO_BUILD_ID" --exit-code "$status" || true
    exit "$status"
}
trap end_build EXIT
trap 'exit 130' INT TERM

# Process each folder
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

echo "All folders processed successfully!"


# -- bash scripts/all.sh  -i ./downloads/input -a ./downloads/clean-articles.json -o downloads/output

# -- bash scripts/all.sh  -i test_data/input/ -a downloads/clean-articles.json  -o test_data/output