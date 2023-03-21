#!/bin/bash
python3 -m src.clean_annotations \
-a ./downloads/input/human_iba_annotations.json \
-t ./downloads/terms.json \
-art ./downloads/input/clean-articles.json \
-g ./downloads/input/human_iba_gene_info.json \
-o ./downloads/input/human_iba_annotations_clean_2.json