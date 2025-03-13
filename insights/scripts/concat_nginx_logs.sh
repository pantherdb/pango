#!/bin/bash

if [ $# -ne 1 ]; then
  echo "Usage: $0 <input_directory>"
  exit 1
fi

INPUT_DIR="$1"
OUTPUT_FILE="all_access_logs.txt"

if [ ! -d "$INPUT_DIR" ]; then
  echo "Error: Directory '$INPUT_DIR' not found."
  exit 1
fi

# Create/clear the output file
> "$OUTPUT_FILE"

find "$INPUT_DIR" -name "access.log.[0-9]*.gz" -type f | while read -r LOG_FILE; do
  echo "Processing $LOG_FILE..."
  gunzip -c "$LOG_FILE" >> "$OUTPUT_FILE"
done

echo "All logs have been concatenated into $OUTPUT_FILE"
echo "Total lines: $(wc -l < "$OUTPUT_FILE")"