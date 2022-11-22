#!/bin/bash
python3 -m src.clean_annotations \
-a ./downloads/human_iba_annotations.json \
-t ./downloads/terms.json \
-art ./downloads/clean-articles.json \
-g ./downloads/human_iba_gene_info.json \
-o ./downloads/human_iba_annotations_clean_2.json