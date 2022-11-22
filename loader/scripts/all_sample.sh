#!/bin/bash

set -e

annotations=./data/test_data/sample_human_iba_annotations.json
terms=./data/test_data/terms.json
genes=./data/test_data/human_iba_gene_info.json
clean_articles=./downloads/clean_articles2.json
clean_annotations=./downloads/human_iba_annotations_clean_2.json


python3 -m src.get_articles -a $annotations -o $clean_articles

python3 -m src.clean_annotations \
-a $annotations \
-t $terms \
-art $clean_articles \
-g $genes \
-o $clean_annotations

python3 -m src.index_es -a $clean_annotations