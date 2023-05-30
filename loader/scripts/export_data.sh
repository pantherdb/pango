#!/bin/bash

set -e

terms_fp='./downloads/input/full_go_annotated.json'
annotations_fp='./downloads/input/human_iba_annotations.json'
genes_fp='./downloads/input/human_iba_gene_info.json'
export_annotations_fp='./downloads/export_annotations_clean.json'


python3 -m src.export_annotations \
-a $annotations_fp \
-t $terms_fp \
-g $genes_fp \
-o $export_annotations_fp
