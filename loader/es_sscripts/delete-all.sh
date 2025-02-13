#!/bin/bash
indices=(
  "pango-1-pango-genes"
  "pango-2-pango-annotations"
  "pango-1-pango-annotations"
  "pango-2-pango-genes"
  pango-test-pango-annotations
  pango-test-pango-genes
)

for index in "${indices[@]}"; do
  echo "Deleting $index"
  curl -X DELETE "http://localhost:9200/$index"
  echo -e "\n"
done