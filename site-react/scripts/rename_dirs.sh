#!/bin/bash

# Check if correct number of arguments are provided
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <directory> <search_word> <replace_word>"
    echo "Example: $0 /path/to/directory oldword newword"
    exit 1
fi

# Store arguments in readable variables
DIR_PATH="$(realpath "$1")"
SEARCH="$2"
REPLACE="$3"

# Check if directory exists
if [ ! -d "$DIR_PATH" ]; then
    echo "Error: Directory '$DIR_PATH' does not exist"
    exit 1
fi

# Function to process rename
process_rename() {
    local old_path="$1"
    local old_basename="$(basename "$old_path")"
    local dir_path="$(dirname "$old_path")"
    local new_basename="${old_basename//$SEARCH/$REPLACE}"
    local new_path="$dir_path/$new_basename"
    
    # Only rename if there's actually a change
    if [ "$old_basename" != "$new_basename" ]; then
        # Check if the new name already exists
        if [ -e "$new_path" ]; then
            echo "Warning: Cannot rename '$old_path' to '$new_path' - target already exists"
            return 1
        fi
        
        mv "$old_path" "$new_path"
        echo "Renamed: $old_path → $new_path"
    fi
}

echo "Starting rename process..."
echo "Searching in: $DIR_PATH"
echo "Replacing: '$SEARCH' with '$REPLACE'"
echo "-----------------------------------"

# First process all files (from deepest to shallowest)
while IFS= read -r -d '' file; do
    process_rename "$file"
done < <(find "$DIR_PATH" -type f -name "*$SEARCH*" -print0 | sort -rz)

# Then process all directories (from deepest to shallowest)
while IFS= read -r -d '' dir; do
    process_rename "$dir"
done < <(find "$DIR_PATH" -type d -name "*$SEARCH*" -print0 | sort -rz)

echo "-----------------------------------"
echo "Renaming complete!"