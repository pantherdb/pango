import unittest
import os
import tempfile
import json
import pandas as pd
from unittest.mock import patch, mock_open
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.clean_annotations import (
    main, parse_arguments, spread_terms, get_aspect, get_evidence, 
    term_type, get_terms_map, get_articles_map, get_taxon_map, 
    get_genes_map, count_evidence, get_groups, get_annos, UNKNOWN_TERMS
)
from src.utils import get_pd_row, get_pd_row_key


class TestCleanAnnotations(unittest.TestCase):
    
    def setUp(self):
        """Set up test data"""
        self.test_data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'test_data')
        self.input_dir = os.path.join(self.test_data_dir, 'input', 'pango-test')
        self.output_dir = os.path.join(self.test_data_dir, 'output', 'pango-test')
        
        # Sample data for testing
        self.sample_terms_data = [
            {
                "ID": "GO:0006955",
                "LABEL": "immune response",
                "hasOBONamespace": "biological_process",
                "is_goslim": False
            },
            {
                "ID": "GO:0002376",
                "LABEL": "immune system process",
                "hasOBONamespace": "biological_process",
                "is_goslim": True
            }
        ]
        
        self.sample_articles_data = [
            {
                "pmid": "PMID:15240696",
                "title": "Two human ULBP/RAET1 molecules",
                "date": 1089849600000,
                "authors": ["Bacon L", "Eagle RA"]
            }
        ]
        
        self.sample_taxon_data = [
            {
                "taxon_id": "9606",
                "taxon_label": "Homo sapiens",
                "taxon_abbr": "Hsa"
            }
        ]
        
        self.sample_genes_data = [
            {
                "gene": "UniProtKB:Q8TD07",
                "gene_symbol": "RAET1E",
                "gene_name": "Retinoic acid early transcript 1E",
                "taxon_id": "9606",
                "panther_family": "PTHR16675",
                "long_id": "HUMAN|HGNC=16793|UniProtKB=Q8TD07"
            }
        ]
        
        self.sample_annotations_data = [
            {
                "gene": "UniProtKB:Q8TD07",
                "term": "GO:0006955",
                "slim_terms": ["GO:0002376"],
                "evidence": [
                    {
                        "with_gene_id": "UniProtKB:Q8TD07",
                        "references": ["PMID:15240696"],
                        "groups": ["UniProt"]
                    }
                ],
                "evidence_type": "direct"
            }
        ]

    def test_term_type_known(self):
        """Test term_type function with known terms"""
        term = {"id": "GO:0006955"}
        result = term_type(term)
        self.assertEqual(result, "known")

    def test_term_type_unknown(self):
        """Test term_type function with unknown terms"""
        term = {"id": "UNKNOWN:0001"}
        result = term_type(term)
        self.assertEqual(result, "unknown")
        
        term = {"id": "UNKNOWN:0002"}
        result = term_type(term)
        self.assertEqual(result, "unknown")

    def test_get_terms_map(self):
        """Test get_terms_map function"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(self.sample_terms_data, f)
            temp_file = f.name
        
        try:
            terms_df = get_terms_map(temp_file)
            
            # Check if dataframe is created correctly
            self.assertIsInstance(terms_df, pd.DataFrame)
            self.assertEqual(len(terms_df), 2)
            self.assertTrue('id' in terms_df.columns)
            self.assertTrue('label' in terms_df.columns)
            self.assertTrue('aspect' in terms_df.columns)
            
            # Check if index is set correctly
            self.assertEqual(terms_df.index.name, 'ID')
            
            # Check data content
            self.assertEqual(terms_df.loc['GO:0006955', 'id'], 'GO:0006955')
            self.assertEqual(terms_df.loc['GO:0006955', 'label'], 'immune response')
            self.assertEqual(terms_df.loc['GO:0006955', 'aspect'], 'biological process')
            
        finally:
            os.unlink(temp_file)

    def test_get_articles_map(self):
        """Test get_articles_map function"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(self.sample_articles_data, f)
            temp_file = f.name
        
        try:
            articles_df = get_articles_map(temp_file)
            
            # Check if dataframe is created correctly
            self.assertIsInstance(articles_df, pd.DataFrame)
            self.assertEqual(len(articles_df), 1)
            self.assertTrue('pmid' in articles_df.columns)
            self.assertTrue('title' in articles_df.columns)
            
            # Check if index is set correctly
            self.assertEqual(articles_df.index.name, 'pmid')
            self.assertEqual(articles_df.loc['PMID:15240696', 'title'], 'Two human ULBP/RAET1 molecules')
            
        finally:
            os.unlink(temp_file)

    def test_get_taxon_map(self):
        """Test get_taxon_map function"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(self.sample_taxon_data, f)
            temp_file = f.name
        
        try:
            taxon_df = get_taxon_map(temp_file)
            
            # Check if dataframe is created correctly
            self.assertIsInstance(taxon_df, pd.DataFrame)
            self.assertEqual(len(taxon_df), 1)
            self.assertTrue('taxon_id' in taxon_df.columns)
            self.assertTrue('taxon_label' in taxon_df.columns)
            self.assertTrue('taxon_abbr' in taxon_df.columns)
            
        finally:
            os.unlink(temp_file)

    def test_get_genes_map(self):
        """Test get_genes_map function"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as genes_f:
            json.dump(self.sample_genes_data, genes_f)
            genes_file = genes_f.name
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as taxon_f:
            json.dump(self.sample_taxon_data, taxon_f)
            taxon_file = taxon_f.name
        
        try:
            taxon_df = get_taxon_map(taxon_file)
            genes_df = get_genes_map(genes_file, taxon_df)
            
            # Check if dataframe is created correctly
            self.assertIsInstance(genes_df, pd.DataFrame)
            self.assertEqual(len(genes_df), 1)
            self.assertTrue('gene' in genes_df.columns)
            self.assertTrue('gene_symbol' in genes_df.columns)
            self.assertTrue('taxon_label' in genes_df.columns)
            
            # Check if merge worked correctly
            self.assertEqual(genes_df.loc['UniProtKB:Q8TD07', 'taxon_label'], 'Homo sapiens')
            
        finally:
            os.unlink(genes_file)
            os.unlink(taxon_file)

    def test_count_evidence(self):
        """Test count_evidence function"""
        evidences = [
            {"with_gene_id": "gene1", "references": ["ref1"], "groups": ["group1"]},
            {"with_gene_id": "gene2", "references": ["ref2"], "groups": ["group2"]}
        ]
        result = count_evidence(evidences)
        self.assertEqual(result, 2)

    def test_get_groups(self):
        """Test get_groups function"""
        evidences = [
            {"groups": ["UniProt", "GO_Central"]},
            {"groups": ["MGI", "UniProt"]},
            {"groups": ["GO_Central"]}
        ]
        result = get_groups(evidences)
        expected = ["UniProt", "GO_Central", "MGI"]
        self.assertEqual(set(result), set(expected))

    def test_spread_terms(self):
        """Test spread_terms function"""
        # Create a mock dataframe
        terms_data = {
            'id': ['GO:0001', 'GO:0002'],
            'label': ['term1', 'term2'],
            'aspect': ['biological_process', 'molecular_function']
        }
        terms_df = pd.DataFrame(terms_data)
        terms_df = terms_df.set_index('id', drop=False)
        
        terms_list = ['GO:0001', 'GO:0002']
        result = spread_terms(terms_df, terms_list)
        
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]['id'], 'GO:0001')
        self.assertEqual(result[1]['id'], 'GO:0002')

    def test_get_aspect(self):
        """Test get_aspect function"""
        # Create a mock dataframe
        terms_data = {
            'aspect': ['biological_process']
        }
        terms_df = pd.DataFrame(terms_data, index=['GO:0001'])
        
        # Test existing term
        result = get_aspect(terms_df, 'GO:0001')
        self.assertEqual(result, 'biological_process')
        
        # Test non-existing term
        result = get_aspect(terms_df, 'GO:9999')
        self.assertEqual(result, 'noGO:9999')

    def test_integration_with_real_test_data(self):
        """Test with real test data files"""
        if not os.path.exists(self.input_dir):
            self.skipTest("Test data directory not found")
        
        terms_file = os.path.join(self.input_dir, 'full_go_annotated.json')
        articles_file = os.path.join(self.test_data_dir, 'clean-articles.json')
        taxon_file = os.path.join(self.input_dir, 'taxon_lkp.json')
        genes_file = os.path.join(self.input_dir, 'human_iba_gene_info.json')
        annos_file = os.path.join(self.input_dir, 'human_iba_annotations.json')
        
        # Test if all required files exist
        for file_path in [terms_file, articles_file, taxon_file, genes_file, annos_file]:
            if not os.path.exists(file_path):
                self.skipTest(f"Required test file not found: {file_path}")
        
        # Test terms mapping
        terms_df = get_terms_map(terms_file)
        self.assertIsInstance(terms_df, pd.DataFrame)
        self.assertGreater(len(terms_df), 0)
        
        # Test articles mapping
        articles_df = get_articles_map(articles_file)
        self.assertIsInstance(articles_df, pd.DataFrame)
        self.assertGreater(len(articles_df), 0)
        
        # Test taxon mapping
        taxon_df = get_taxon_map(taxon_file)
        self.assertIsInstance(taxon_df, pd.DataFrame)
        self.assertGreater(len(taxon_df), 0)
        
        # Test genes mapping
        genes_df = get_genes_map(genes_file, taxon_df)
        self.assertIsInstance(genes_df, pd.DataFrame)
        self.assertGreater(len(genes_df), 0)
        
        # Test annotations processing (sample only due to processing time)
        annos_df = pd.read_json(annos_file)
        sample_annos = annos_df.head(5)  # Test with first 5 rows only
        
        # Create temporary file for sample data
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            sample_annos.to_json(f.name, orient='records')
            sample_file = f.name
        
        try:
            result_df = get_annos(sample_file, terms_df, genes_df, articles_df)
            self.assertIsInstance(result_df, pd.DataFrame)
            
            # Check required columns exist
            expected_columns = [
                'gene', 'term', 'slim_terms', 'evidence', 'aspect', 
                'term_type', 'groups', 'evidence_count'
            ]
            for col in expected_columns:
                self.assertIn(col, result_df.columns)
                
        finally:
            os.unlink(sample_file)


class TestCleanAnnotationsArguments(unittest.TestCase):
    """Test argument parsing"""
    
    @patch('sys.argv', ['clean_annotations.py', 
                        '-a', 'annotations.json',
                        '-t', 'terms.json', 
                        '-art', 'articles.json',
                        '-tax', 'taxon.json',
                        '-g', 'genes.json',
                        '-o', 'output.json'])
    def test_parse_arguments(self, mock_file_path=None):
        """Test argument parsing"""
        # Create temporary files to satisfy file_path validation
        temp_files = []
        try:
            # Create temporary files for each argument
            for filename in ['annotations.json', 'terms.json', 'articles.json', 'taxon.json', 'genes.json']:
                temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
                temp_file.write('{}')
                temp_file.close()
                temp_files.append(temp_file.name)
            
            # Update sys.argv with actual temp file paths
            with patch('sys.argv', ['clean_annotations.py', 
                                    '-a', temp_files[0],
                                    '-t', temp_files[1], 
                                    '-art', temp_files[2],
                                    '-tax', temp_files[3],
                                    '-g', temp_files[4],
                                    '-o', 'output.json']):
                args = parse_arguments()
                
                self.assertEqual(args.annos_fp, temp_files[0])
                self.assertEqual(args.terms_fp, temp_files[1])
                self.assertEqual(args.articles_fp, temp_files[2])
                self.assertEqual(args.taxon_fp, temp_files[3])
                self.assertEqual(args.genes_fp, temp_files[4])
                self.assertEqual(args.clean_annos_fp, 'output.json')
                
        finally:
            # Clean up temp files
            for temp_file in temp_files:
                try:
                    os.unlink(temp_file)
                except OSError:
                    pass


if __name__ == '__main__':
    unittest.main()
