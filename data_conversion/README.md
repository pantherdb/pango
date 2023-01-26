# Data conversion
Convert data tied to a specific PAINT IBA release into JSON format for loading to elasticsearch.
## Run
Specify a destination `{target}` folder and run from `data_conversion`:
```
make {target}/all
```
## Annotations
Produce JSON file `human_iba_annotations.json` containing annotations from a GAF file.
### Prepare goslim_generic.tsv input
```
robot export --input goslim_generic.owl --header "ID" --format tsv --export goslim_generic.tsv
```
### Run iba_exp_refs_to_json.py
```
python3 iba_exp_refs_to_json.py \
-f gene_association.paint_human.gaf \
-o goparentchild.tsv \
-s goslim_generic.tsv \
-a go_aspects.tsv > human_iba_annotations.json
```
```
  -f, --annot_files ANNOT_FILES
                        IBA GAF file with extra EXP_REF field; Will be an
                        'exploded' GAF containing multiple lines per
                        annotation with one line per with/from value
  -o, --ontology ONTOLOGY
                        TSV of GO term parent(col1)-child(col2) relationships
                        (is_a, part_of only)
  -a, --go_aspects GO_ASPECTS
                        TSV of GO term->aspect lookup
  -s, --goslim_term_list GOSLIM_TERM_LIST
                        File list of the Generic GO slim terms
```
Scripts to produce source files:
* [createGAF_human_exp_references.pl](https://github.com/pantherdb/fullgo_paint_update/blob/master/scripts/createGAF_human_exp_references.pl) -> `gene_association.paint_human.gaf`
* [extractfromgoobo_relation.pl](https://github.com/pantherdb/fullgo_paint_update/blob/master/scripts/extractfromgoobo_relation.pl) -> `goparentchild.tsv`
* [robot_go_aspects.slurm](https://github.com/pantherdb/fullgo_paint_update/blob/master/scripts/robot_go_aspects.slurm) -> `go_aspects.tsv`

**NOTE:** `createGAF_human_exp_references.pl` will add extra data columns to provide experimental references and group info, technically creating an invalid GAF formatted file that should only be consumed by `iba_exp_refs_to_json.py`.
## Ontology
Produce JSON file `full_go_annotated.json`.
```
robot export --input go.obo --header "ID|LABEL|hasOBONamespace" --format json --export full_go.json

python3 annotate_is_goslim_json_ontology.py \
-g goslim_generic.tsv \
-p full_go.json > full_go_annotated.json
```
## Gene list
Produce JSON file `human_iba_gene_info.json` containing distinct gene info by adding the `-g, --gene_info_only` option.
```
python3 iba_exp_refs_to_json.py \
-f gene_association.paint_human.gaf \
-o goparentchild.tsv \
-s goslim_generic.tsv \
-a go_aspects.tsv -g > human_iba_gene_info.json
```
## Dependencies
[robot](http://robot.obolibrary.org/)
