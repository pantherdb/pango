from iba_exp_refs_to_json import IbaExpRefManager, IbaExpRefCollection, OntologyManager
from gene_info_from_gafs import GeneInfoCollection

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
    # assert annots[0]["qualifier"] is None

    # Retest with PAINT qualifier 'colocalizes_with'
    test_row[3] = "colocalizes_with"
    collection = IbaExpRefCollection(ont_manager)
    collection.update_annot_from_row(test_row)
    annots = collection.annotation_list()
    # assert annots[0]["qualifier"] is None  # We no longer want to track qualifiers at all

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

    # Ensure the two NOT annotations do not block UNKNOWNs to those aspects
    assert "UNKNOWN:0001" in iba_collection.annotation_lkp["UniProtKB:O14531"]
    assert "UNKNOWN:0002" in iba_collection.annotation_lkp["UniProtKB:O14531"]
    assert "UNKNOWN:0003" in iba_collection.annotation_lkp["UniProtKB:O14531"]


def test_direct_evidence_sorting():
    gene_id = "UniProtKB:Q9HBH0"
    go_term = "GO:0007015"
    qualifier = ""
    iba_gaf = "resources/test/gene_association.paint_human.gaf"
    iba_collection = IbaExpRefManager.parse(iba_gaf, ont_manager)
    evidences = iba_collection.annotation_lkp[gene_id][go_term][qualifier]["evidence"]
    assert evidences[0]["with_gene_id"] == gene_id


def test_genome_coordinates():
    gene_id = "UniProtKB:Q9HBH0"
    iba_gaf = "resources/test/gene_association.paint_human.gaf"
    genome_coords_file = "resources/test/Homo_sapiens.genome_coords_sample"
    iba_collection = IbaExpRefManager.parse(iba_gaf, ont_manager)
    iba_collection.fill_in_genome_coordinates(genome_coords_file)
    gene_info = iba_collection.gene_info_lkp[gene_id]
    assert gene_info["coordinates_start"] == "121780952"
    gene_info_list = iba_collection.gene_info_list()
    gene_info_json_obj = None
    for gi in gene_info_list:
        if gi["gene"] == gene_id:
            gene_info_json_obj = gi
            break
    assert gene_info_json_obj["coordinates_start"] == "121780952"


def test_inferred_slim_terms():
    # Test that slim term inference only captures the most specific slim terms
    # GO:0017116 -is_a-> GO:0140097 -is_a-> GO:0003824
    # So, GO:0003824 should not be in 'slim_terms'
    test_row = ['UniProtKB', 'Q07001', 'CHRND', 'is_active_in', 'GO:0017116', 'PMID:21873635', 'IBA',
                'PANTHER:PTN000434994|RGD:2704', 'F', 'Acetylcholine receptor subunit delta',
                'UniProtKB:Q07001|PTN002498466', 'protein', 'taxon:9606', '20211216', 'GO_Central', '', '',
                'PMID:25339867|PMID:23175852', 'Glra1', 'Glycine receptor subunit alpha-1', 'taxon:10116', 'RGD']
    collection = IbaExpRefCollection(ont_manager)
    collection.update_annot_from_row(test_row)
    annots = collection.annotation_list()
    assert "GO:0003824" not in annots[0]["slim_terms"]


def test_term_ancestry():
    assert ont_manager.is_ancestor_of('GO:0003824', 'GO:0017116') is True
    assert ont_manager.is_ancestor_of('GO:0017116', 'GO:0003824') is None  # Good enough stand-in for False
    assert ont_manager.is_ancestor_of('GO:0003824', 'GO:0140097') is True


def test_gene_symbols_names():
    iba_gaf = "resources/test/gene_association.paint_human.gaf"
    exp_gaf = "resources/annot_human_genes_not_in_families_selected.gaf"
    test_gene_dat = "resources/test/gene.dat"
    gene_info_collection = GeneInfoCollection()
    gene_info_collection.extract_from_annotation_gaf([iba_gaf, exp_gaf])
    gene_info_collection.fill_in_gene_symbol_name(test_gene_dat)
    assert gene_info_collection.gene_info_dict["UniProtKB:Q9NUQ7"]["gene_name"] == "Ufm1-specific protease 2"
    assert gene_info_collection.gene_info_dict["UniProtKB:A0A1W2PRP0"]["gene_symbol"] == "A0A1W2PRP0"
    assert gene_info_collection.gene_info_dict["UniProtKB:X6R8D5"]["gene_symbol"] == "X6R8D5"


def test_evidence_type_assignment():
    gaf_files = [
        "resources/annot_human_genes_not_in_families_selected.gaf",
        "resources/test/gene_association.paint_human.gaf"
    ]
    test_gene_dat = "resources/test/gene.dat"
    iba_collection = IbaExpRefManager.parse(gaf_files, ont_manager)
    iba_collection.fill_in_missing_annotations(test_gene_dat)
    # Selected experimental-only should be 'direct'
    annot = iba_collection.annotation_lkp["UniProtKB:A6NCN2"]["GO:0005615"][""]
    assert annot["evidence_type"] == "direct"
    # IBA with evidence gene of same ID should be 'direct'
    annot = iba_collection.annotation_lkp["UniProtKB:Q9HBH0"]["GO:0007015"][""]
    assert annot["evidence_type"] == "direct"
    # IBA without evidence gene of same ID should be 'homology'
    annot = iba_collection.annotation_lkp["UniProtKB:P28472"]["GO:0005254"][""]
    assert annot["evidence_type"] == "homology"
    # Filled in UNKNOWN annotations should be 'n/a'
    annot = iba_collection.annotation_lkp["UniProtKB:X6R8D5"]["UNKNOWN:0001"][""]
    assert annot["evidence_type"] == "n/a"
