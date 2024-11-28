#!/bin/bash
indices=(
)

for index in "${indices[@]}"; do
  echo "Deleting $index"
  curl -X DELETE "http://localhost:9200/$index"
  echo -e "\n"
done