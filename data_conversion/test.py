from iba_exp_refs_to_json import IbaExpRefManager, IbaExpRefCollection, OntologyManager

goslim_term_file = "resources/test/goslim_generic.tsv"
ontology_file = "resources/test/goparentchild.tsv"
aspect_file = "resources/test/go_aspects.tsv"
ont_manager = OntologyManager(goslim_term_file, ontology_file, aspect_file)


def test_taxon_id():
    iba_gaf = "resources/test/gene_association.paint_human.gaf"
    iba_collection = IbaExpRefManager.parse(iba_gaf, ont_manager)
    # Check that taxon ID for YEAST, MOUSE and HUMAN are set
    assert iba_collection.gene_info_lkp["UniProtKB:O00425"]["taxon_id"] == "9606"
    assert iba_collection.gene_info_lkp["SGD:S000000437"]["taxon_id"] == "559292"
    assert iba_collection.gene_info_lkp["MGI:MGI:1337995"]["taxon_id"] == "10090"


def test_qualifier():
    # Test that null value is returned for standard qualifier relations like 'is_active_in'
    test_row = ['UniProtKB', 'Q07001', 'CHRND', 'is_active_in', 'GO:0005887', 'PMID:21873635', 'IBA',
                'PANTHER:PTN000434994|RGD:2704', 'C', 'Acetylcholine receptor subunit delta',
                'UniProtKB:Q07001|PTN002498466', 'protein', 'taxon:9606', '20211216', 'GO_Central', '', '',
                'PMID:25339867|PMID:23175852', 'Glra1', 'Glycine receptor subunit alpha-1', 'taxon:10116', 'RGD']
    collection = IbaExpRefCollection(ont_manager)
    collection.update_annot_from_row(test_row)
    annots = collection.annotation_list()
    assert annots[0]["qualifier"] is None

    # Retest with PAINT qualifier 'colocalizes_with'
    test_row[3] = "colocalizes_with"
    collection = IbaExpRefCollection(ont_manager)
    collection.update_annot_from_row(test_row)
    annots = collection.annotation_list()
    assert annots[0]["qualifier"] == "colocalizes_with"

    # Retest with a NOT, ensuring this annotation is omitted
    test_row[3] = "NOT|colocalizes_with"
    collection = IbaExpRefCollection(ont_manager)
    collection.update_annot_from_row(test_row)
    annots = collection.annotation_list()
    assert len(annots) == 0


def test_other_terms():
    term_that_has_no_slim_ancestor = "GO:0008134"
    other_term = ont_manager.other_term(term_that_has_no_slim_ancestor)
    assert other_term == "OTHER:0001"


def test_filling_in_the_unknowns():
    iba_gaf = "resources/test/gene_association.paint_human.gaf"
    gene_dat = "resources/test/gene.dat"
    iba_collection = IbaExpRefManager.parse(iba_gaf, ont_manager)
    iba_collection.fill_in_missing_annotations(gene_dat)
    assert "UNKNOWN:0002" in iba_collection.annotation_lkp["UniProtKB:P28472"]
    assert "UNKNOWN:0003" in iba_collection.annotation_lkp["UniProtKB:P28472"]
    assert "UNKNOWN:0001" not in iba_collection.annotation_lkp["UniProtKB:P28472"]
