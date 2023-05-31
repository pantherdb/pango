#!/bin/bash

set -e

terms_fp='./downloads/input/full_go_annotated.json'
annotations_fp='./downloads/input/human_iba_annotations.json'
genes_fp='./downloads/input/human_iba_gene_info.json'
out_json_fp='./downloads/export_annotations.json.gz'
out_tsv_fp='./downloads/export_annotations.zip'


python3 -m src.export_annotations \
-a $annotations_fp \
-t $terms_fp \
-g $genes_fp \
--ojson $out_json_fp \
--otsv $out_tsv_fp
