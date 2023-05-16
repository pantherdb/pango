SHELL := /bin/bash

%/all: %/full_go_annotated.json %/human_iba_annotations.json %/human_iba_gene_info.json %/taxon_lkp.json
	echo "Done"

%/resources/gene_association.paint_human.gaf.gz:
	mkdir -p $*/resources
	wget http://data.pantherdb.org/ftp/downloads/paint/test/15.0/2022-04-18/presubmission/gene_association.paint_human.gaf.gz -O $@

.PRECIOUS: %/resources/gene_association.paint_human.gaf
%/resources/gene_association.paint_human.gaf: %/resources/gene_association.paint_human.gaf.gz
	gunzip $<

.PRECIOUS: %/resources/gene.dat.gz
%/resources/gene.dat.gz:
	mkdir -p $*/resources
	wget http://data.pantherdb.org/PANTHER15.0/globals/gene.dat.gz -O $@

.PRECIOUS: %/resources/gene.dat
%/resources/gene.dat: %/resources/gene.dat.gz
	gunzip $<

.PRECIOUS: %/resources/gene_node.dat.gz
%/resources/gene_node.dat.gz:
	mkdir -p $*/resources
	wget http://data.pantherdb.org/PANTHER15.0/globals/gene_node.dat.gz -O $@

.PRECIOUS: %/resources/gene_node.dat
%/resources/gene_node.dat: %/resources/gene_node.dat.gz
	gunzip $<

.PRECIOUS: %/resources/Homo_sapiens.chromosomal_location.gz
%/resources/Homo_sapiens.chromosomal_location.gz:
	mkdir -p $*/resources
	wget http://data.pantherdb.org/PANTHER15.0/globals/Homo_sapiens.chromosomal_location.gz -O $@

.PRECIOUS: %/resources/Homo_sapiens.chromosomal_location
%/resources/Homo_sapiens.chromosomal_location: %/resources/Homo_sapiens.chromosomal_location.gz
	gunzip $<

.PRECIOUS: %/resources/goparentchild.tsv
%/resources/goparentchild.tsv:
	mkdir -p $*/resources
	wget http://data.pantherdb.org/ftp/downloads/paint/test/15.0/2022-04-18/goparentchild.tsv -O $@

.PRECIOUS: %/resources/go_aspects.tsv
%/resources/go_aspects.tsv:
	mkdir -p $*/resources
	wget http://data.pantherdb.org/ftp/downloads/paint/test/15.0/2022-04-18/go_aspects.tsv -O $@

.PRECIOUS: %/resources/species_list_15.tsv
%/resources/species_list_15.tsv:
	mkdir -p $*/resources
	wget http://data.pantherdb.org/PANTHER15.0/globals/species_list.tsv -O $@

.PRECIOUS: %/resources/goslim_generic.owl
%/resources/goslim_generic.owl:
	mkdir -p $*/resources
	wget http://current.geneontology.org/ontology/subsets/goslim_generic.owl -O $@

.PRECIOUS: %/resources/go.obo
%/resources/go.obo:
	mkdir -p $*/resources
	wget http://release.geneontology.org/2022-03-22/ontology/go.obo -O $@

.PRECIOUS: %/bin/robot
%/bin/robot:
	mkdir -p $*/bin
	wget https://github.com/ontodev/robot/releases/download/v1.7.0/robot.jar -O $*/bin/robot.jar
	wget https://github.com/ontodev/robot/raw/master/bin/robot -O $@
	chmod 744 $@

.PRECIOUS: %/goslim_generic_w_alt_ids.tsv
%/goslim_generic_w_alt_ids.tsv: resources/goslim_generic_pt.obo %/bin/robot
	$*/bin/robot export --input $< --header "ID|LABEL" --format tsv --export $@

.PRECIOUS: %/goslim_generic.tsv
%/goslim_generic.tsv: %/goslim_generic_w_alt_ids.tsv
	awk '$$2 != ""' $< | cut -f1 | grep GO > $@

.PRECIOUS: %/human_iba_annotations.json
%/human_iba_annotations.json: %/resources/gene_association.paint_human.gaf %/resources/goparentchild.tsv %/goslim_generic.tsv %/resources/go_aspects.tsv %/resources/gene.dat
	python3 iba_exp_refs_to_json.py -f $*/resources/gene_association.paint_human.gaf resources/annot_human_genes_not_in_families_selected.gaf -o $*/resources/goparentchild.tsv -s $*/goslim_generic.tsv -a $*/resources/go_aspects.tsv -p $*/resources/gene.dat > $@

# .PRECIOUS: %/human_iba_gene_info.json
# %/human_iba_gene_info.json: %/resources/gene_association.paint_human.gaf %/resources/goparentchild.tsv %/goslim_generic.tsv %/resources/go_aspects.tsv %/resources/gene.dat %/resources/Homo_sapiens.chromosomal_location
# 	python3 iba_exp_refs_to_json.py -f $*/resources/gene_association.paint_human.gaf -o $*/resources/goparentchild.tsv -s $*/goslim_generic.tsv -a $*/resources/go_aspects.tsv -p $*/resources/gene.dat -c $*/resources/Homo_sapiens.chromosomal_location -g > $@

.PRECIOUS: %/human_iba_gene_info.json
%/human_iba_gene_info.json: %/resources/gene_association.paint_human.gaf %/resources/gene.dat %/resources/gene_node.dat %/resources/Homo_sapiens.chromosomal_location
	python3 gene_info_from_gafs.py -a $*/resources/gene_association.paint_human.gaf resources/annot_human_genes_not_in_families_selected.gaf -g $*/resources/gene.dat -n $*/resources/gene_node.dat -c $*/resources/Homo_sapiens.chromosomal_location > $@

.PRECIOUS: %/taxon_lkp.json
%/taxon_lkp.json: %/human_iba_gene_info.json %/resources/species_list_15.tsv
	python3 gene_info_taxon_lookup.py -g $*/human_iba_gene_info.json -s $*/resources/species_list_15.tsv > $@

.PRECIOUS: %/full_go.json
%/full_go.json: %/resources/go.obo %/bin/robot
	$*/bin/robot export --input $*/resources/go.obo --header "ID|LABEL|hasOBONamespace" --format json --export $@

.PRECIOUS: %/full_go_annotated.json
%/full_go_annotated.json: %/goslim_generic.tsv %/full_go.json
	python3 annotate_is_goslim_json_ontology.py -g $*/goslim_generic.tsv -p $*/full_go.json > $@

tests:
	pytest test.py