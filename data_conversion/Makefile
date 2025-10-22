SHELL := /bin/bash

export PANTHER_VERSION ?= 15.0
export DEBUG_INDENT ?= 0

%/all: %/full_go_annotated.json %/human_iba_annotations.json %/human_iba_gene_info.json %/taxon_lkp.json %/export_annotations.touch
	echo "Done"

.PRECIOUS: %/resources/gene_association.paint_human.gaf
%/resources/gene_association.paint_human.gaf:
	mkdir -p $*/resources
	@if [ -n "$(HUMAN_IBA_GAF)" ] && [ -f "$(HUMAN_IBA_GAF)" ]; then \
		echo "Copying file $(HUMAN_IBA_GAF) to $@"; \
		cp "$(HUMAN_IBA_GAF)" $@; \
	else \
		echo "Downloading the default 15.0/2022-04-18 human IBA GAF"; \
		wget http://data.pantherdb.org/ftp/downloads/paint/test/15.0/2022-04-18/presubmission/gene_association.paint_human.gaf.gz -O $*/resources/gene_association.paint_human.gaf.gz; \
		gunzip $*/resources/gene_association.paint_human.gaf.gz; \
	fi

.PRECIOUS: %/resources/gene.dat.gz
%/resources/gene.dat.gz:
	mkdir -p $*/resources
	wget http://data.pantherdb.org/PANTHER$(PANTHER_VERSION)/globals/gene.dat.gz -O $@

.PRECIOUS: %/resources/gene.dat
%/resources/gene.dat: %/resources/gene.dat.gz
	gunzip $<

.PRECIOUS: %/resources/gene_node.dat.gz
%/resources/gene_node.dat.gz:
	mkdir -p $*/resources
	wget http://data.pantherdb.org/PANTHER$(PANTHER_VERSION)/globals/gene_node.dat.gz -O $@

.PRECIOUS: %/resources/gene_node.dat
%/resources/gene_node.dat: %/resources/gene_node.dat.gz
	gunzip $<

.PRECIOUS: %/resources/Homo_sapiens.chromosomal_location.gz
%/resources/Homo_sapiens.chromosomal_location.gz:
	mkdir -p $*/resources
	wget http://data.pantherdb.org/PANTHER$(PANTHER_VERSION)/globals/Homo_sapiens.chromosomal_location.gz -O $@

.PRECIOUS: %/resources/Homo_sapiens.chromosomal_location
%/resources/Homo_sapiens.chromosomal_location: %/resources/Homo_sapiens.chromosomal_location.gz
	gunzip $<

.PRECIOUS: %/resources/goparentchild.tsv
%/resources/goparentchild.tsv:
	mkdir -p $*/resources
	@if [ -n "$(GO_PARENT_CHILD_TSV)" ] && [ -f "$(GO_PARENT_CHILD_TSV)" ]; then \
		echo "Copying file $(GO_PARENT_CHILD_TSV) to $@"; \
		cp "$(GO_PARENT_CHILD_TSV)" $@; \
	else \
		echo "Downloading the default 15.0/2022-04-18 goparentchild.tsv"; \
		wget http://data.pantherdb.org/ftp/downloads/paint/test/15.0/2022-04-18/goparentchild.tsv -O $@; \
	fi

.PRECIOUS: %/resources/go_aspects.tsv
%/resources/go_aspects.tsv: %/resources/go.obo
	mkdir -p $*/resources
	# wget http://data.pantherdb.org/ftp/downloads/paint/test/15.0/2022-04-18/go_aspects.tsv -O $@
	$*/bin/robot export --input $< --format tsv --header "ID|hasOBONamespace" --export $@
	awk '$$2 != ""' $*/resources/go_aspects.tsv | tail -n +2 > $*/resources/go_aspects.tsv.tmp
	mv $*/resources/go_aspects.tsv.tmp $@

.PRECIOUS: %/resources/species_list.tsv
%/resources/species_list.tsv:
	mkdir -p $*/resources
	wget http://data.pantherdb.org/PANTHER$(PANTHER_VERSION)/globals/species_list.tsv -O $@

.PRECIOUS: %/resources/goslim_generic.owl
%/resources/goslim_generic.owl:
	mkdir -p $*/resources
	wget http://current.geneontology.org/ontology/subsets/goslim_generic.owl -O $@

.PRECIOUS: %/resources/go.obo
%/resources/go.obo:
	mkdir -p $*/resources
	@if [ -n "$(GO_OBO)" ] && [ -f "$(GO_OBO)" ]; then \
		echo "Copying file $(GO_OBO) to $@"; \
		cp "$(GO_OBO)" $@; \
	else \
		echo "Downloading the default 2022-03-22 GO release go.obo"; \
		wget http://release.geneontology.org/2022-03-22/ontology/go.obo -O $@; \
	fi

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
	python3 iba_exp_refs_to_json.py --debug_indent $(DEBUG_INDENT) -f $*/resources/gene_association.paint_human.gaf resources/annot_human_genes_not_in_families_selected.gaf -o $*/resources/goparentchild.tsv -s $*/goslim_generic.tsv -a $*/resources/go_aspects.tsv -p $*/resources/gene.dat > $@

.PRECIOUS: %/human_iba_gene_info.json
%/human_iba_gene_info.json: %/resources/gene_association.paint_human.gaf %/resources/gene.dat %/resources/gene_node.dat %/resources/Homo_sapiens.chromosomal_location
	python3 gene_info_from_gafs.py --debug_indent $(DEBUG_INDENT) -a $*/resources/gene_association.paint_human.gaf resources/annot_human_genes_not_in_families_selected.gaf -g $*/resources/gene.dat -n $*/resources/gene_node.dat -c $*/resources/Homo_sapiens.chromosomal_location > $@

.PRECIOUS: %/taxon_lkp.json
%/taxon_lkp.json: %/resources/species_list.tsv
	python3 gene_info_taxon_lookup.py --debug_indent $(DEBUG_INDENT) -g $*/human_iba_gene_info.json -s $*/resources/species_list.tsv > $@

.PRECIOUS: %/full_go.json
%/full_go.json: %/resources/go.obo %/bin/robot
	$*/bin/robot export --input $*/resources/go.obo --header "ID|LABEL|hasOBONamespace" --format json --export $@

.PRECIOUS: %/full_go_annotated.json
%/full_go_annotated.json: %/goslim_generic.tsv %/full_go.json
	python3 annotate_is_goslim_json_ontology.py --debug_indent $(DEBUG_INDENT) -g $*/goslim_generic.tsv -p $*/full_go.json > $@

.PRECIOUS: %/export_annotations.touch
%/export_annotations.touch: %/human_iba_annotations.json %/full_go_annotated.json %/human_iba_gene_info.json
	python3 export_annotations.py -a $< -t $*/full_go_annotated.json -g $*/human_iba_gene_info.json -j $*/export_annotations.json -s $*/export_annotations.tsv -u $*/uniprot-functionome_xrefs.tsv
	touch $@

%/functionome_release.gaf: %/resources/gene_association.paint_human.gaf
	# Group by cols 1-7 + PTN (from col8) + cols 9-17, collapse gene IDs following the PTN into col8
	python3 produce_functionome_release_gaf.py $< $@

%/functionome_release.gaf.gz: %/functionome_release.gaf
	gzip -c $< > $@

tests:
	pytest test.py