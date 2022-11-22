#!/bin/bash

set -e

python3 -m src.get_articles -a ./downloads/human_iba_annotations.json -o ./downloads/clean_articles2.json

python3 -m src.clean_annotations \
-a ./downloads/human_iba_annotations.json \
-t ./downloads/terms.json \
-art ./downloads/clean-articles2.json \
-g ./downloads/human_iba_gene_info.json \
-o ./downloads/human_iba_annotations_clean_2.json

python3 -m src.index_es -a downloads/human_iba_annotations_clean_2.json