#!/bin/bash

set -e


terms_fp='./downloads/input/full_go_annotated.json'
annotations_fp='./downloads/input/human_iba_annotations.json'
clean_articles_fp='./downloads/clean-articles.json'
genes_fp='./downloads/input/human_iba_gene_info.json'
taxon_fp='./downloads/input/taxon_lkp.json'
clean_annotations_fp='./downloads/human_iba_annotations_clean2.json'


python3 -m src.get_articles -a $annotations_fp -o $clean_articles_fp

python3 -m src.clean_annotations \
-a $annotations_fp \
-t $terms_fp \
-art $clean_articles_fp \
-g $genes_fp \
-o $clean_annotations_fp

python3 -m src.index_es -a $clean_annotations_fp