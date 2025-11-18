import unittest
import os
import tempfile
import json
import pandas as pd
from unittest.mock import patch, mock_open
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.generate_gene_annotations import (
    main, parse_arguments, uniquify_term, uniquify_slim_terms, 
    group_terms, get_annos, COLUMNS_TO_EXTRACT
)


class TestGenerateGeneAnnotations(unittest.TestCase):
    
    def setUp(self):
        """Set up test data"""
        self.test_data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'test_data')
        self.output_dir = os.path.join(self.test_data_dir, 'output', 'pango-test')
        
        # Sample clean annotations data for testing
        self.sample_clean_annos = [
            {
                "gene": "UniProtKB:Q8TD07",
                "term": {
                    "id": "GO:0006955",
                    "label": "immune response",
                    "aspect": "biological_process",
                    "is_goslim": False
                },
                "slim_terms": [
                    {
                        "id": "GO:0002376",
                        "label": "immune system process",
                        "aspect": "biological_process",
                        "is_goslim": True
                    }
                ],
                "evidence": [
                    {
                        "with_gene_id": {"gene": "UniProtKB:Q8TD07"},
                        "groups": ["UniProt"],
                        "references": [{"pmid": "PMID:15240696"}]
                    }
                ],
                "evidence_type": "direct",
                "gene_symbol": "RAET1E",
                "gene_name": "Retinoic acid early transcript 1E",
                "taxon_id": "9606",
                "taxon_label": "Homo sapiens",
                "taxon_abbr": "Hsa",
                "panther_family": "PTHR16675",
                "long_id": "HUMAN|HGNC=16793|UniProtKB=Q8TD07",
                "coordinates_chr_num": 6.0,
                "coordinates_start": 149889095.0,
                "coordinates_end": 149890932.0
            },
            {
                "gene": "UniProtKB:Q8TD07",  # Same gene, different term
                "term": {
                    "id": "GO:0005102",
                    "label": "signaling receptor binding",
                    "aspect": "molecular_function",
                    "is_goslim": True
                },
                "slim_terms": [
                    {
                        "id": "GO:0005102",
                        "label": "signaling receptor binding",
                        "aspect": "molecular_function",
                        "is_goslim": True
                    }
                ],
                "evidence": [],
                "evidence_type": "homology",
                "gene_symbol": "RAET1E",
                "gene_name": "Retinoic acid early transcript 1E",
                "taxon_id": "9606",
                "taxon_label": "Homo sapiens",
                "taxon_abbr": "Hsa",
                "panther_family": "PTHR16675",
                "long_id": "HUMAN|HGNC=16793|UniProtKB=Q8TD07",
                "coordinates_chr_num": 6.0,
                "coordinates_start": 149889095.0,
                "coordinates_end": 149890932.0
            }
        ]

    def test_uniquify_term(self):
        """Test uniquify_term function"""
        # Test with unique terms
        terms_series = pd.Series([
            {"id": "GO:0001", "label": "term1", "is_goslim": False},
            {"id": "GO:0002", "label": "term2", "is_goslim": True}
        ])
        evidence_series = pd.Series(["direct", "homology"])
        
        result = uniquify_term(terms_series, evidence_series)
        
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]['id'], 'GO:0001')
        self.assertEqual(result[0]['evidence_type'], 'direct')
        self.assertNotIn('is_goslim', result[0])  # Should be removed
        
        self.assertEqual(result[1]['id'], 'GO:0002')
        self.assertEqual(result[1]['evidence_type'], 'homology')

    def test_uniquify_term_with_duplicates(self):
        """Test uniquify_term function with duplicate terms (should raise error)"""
        terms_series = pd.Series([
            {"id": "GO:0001", "label": "term1", "is_goslim": False},
            {"id": "GO:0001", "label": "term1", "is_goslim": False}  # Duplicate
        ])
        evidence_series = pd.Series(["direct", "homology"])
        
        with self.assertRaises(ValueError) as context:
            uniquify_term(terms_series, evidence_series)
        
        self.assertIn("Duplicate term found", str(context.exception))

    def test_uniquify_slim_terms(self):
        """Test uniquify_slim_terms function"""
        slim_terms_series = pd.Series([
            [
                {"id": "GO:0001", "label": "slim1", "is_goslim": True},
                {"id": "GO:0002", "label": "slim2", "is_goslim": True}
            ],
            [
                {"id": "GO:0001", "label": "slim1", "is_goslim": True},  # Duplicate across rows
                {"id": "GO:0003", "label": "slim3", "is_goslim": True}
            ]
        ])
        evidence_series = pd.Series(["direct", "homology"])
        
        result = uniquify_slim_terms(slim_terms_series, evidence_series)
        
        # Should have 3 unique terms (GO:0001, GO:0002, GO:0003)
        term_ids = [term['id'] for term in result]
        unique_ids = set(term_ids)
        self.assertEqual(len(unique_ids), 3)
        self.assertIn('GO:0001', unique_ids)
        self.assertIn('GO:0002', unique_ids)
        self.assertIn('GO:0003', unique_ids)
        
        # Check that is_goslim is removed
        for term in result:
            self.assertNotIn('is_goslim', term)

    def test_group_terms(self):
        """Test group_terms function"""
        # Create a mock group (DataFrame with multiple rows for same gene)
        data = {
            'gene': ['UniProtKB:Q8TD07', 'UniProtKB:Q8TD07'],
            'term': [
                {"id": "GO:0001", "label": "term1", "is_goslim": False},
                {"id": "GO:0002", "label": "term2", "is_goslim": True}
            ],
            'slim_terms': [
                [{"id": "GO:0101", "label": "slim1", "is_goslim": True}],
                [{"id": "GO:0102", "label": "slim2", "is_goslim": True}]
            ],
            'evidence_type': ['direct', 'homology'],
            'gene_symbol': ['RAET1E', 'RAET1E'],
            'gene_name': ['Gene name', 'Gene name'],
            'taxon_id': ['9606', '9606'],
            'taxon_label': ['Homo sapiens', 'Homo sapiens'],
            'taxon_abbr': ['Hsa', 'Hsa'],
            'panther_family': ['PTHR16675', 'PTHR16675'],
            'long_id': ['HUMAN|HGNC=16793|UniProtKB=Q8TD07', 'HUMAN|HGNC=16793|UniProtKB=Q8TD07'],
            'coordinates_chr_num': [6.0, 6.0],
            'coordinates_start': [149889095.0, 149889095.0],
            'coordinates_end': [149890932.0, 149890932.0]
        }
        
        group_df = pd.DataFrame(data)
        result = group_terms(group_df)
        
        # Check that result is a Series with expected structure
        self.assertIsInstance(result, pd.Series)
        
        # Check that all COLUMNS_TO_EXTRACT are present
        for col in COLUMNS_TO_EXTRACT:
            self.assertIn(col, result.index)
        
        # Check additional fields
        self.assertIn('terms', result.index)
        self.assertIn('slim_terms', result.index)
        self.assertIn('term_count', result.index)
        
        # Check data content
        self.assertEqual(result['gene_symbol'], 'RAET1E')
        self.assertEqual(result['term_count'], 2)  # Two unique terms
        self.assertEqual(len(result['terms']), 2)
        self.assertGreater(len(result['slim_terms']), 0)

    def test_get_annos(self):
        """Test get_annos function"""
        # Create temporary file with sample data
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(self.sample_clean_annos, f)
            temp_file = f.name
        
        try:
            result_df = get_annos(temp_file)
            
            # Check that result is a DataFrame
            self.assertIsInstance(result_df, pd.DataFrame)
            
            # Check that we have one row (one unique gene)
            self.assertEqual(len(result_df), 1)
            
            # Check that required columns exist
            expected_columns = COLUMNS_TO_EXTRACT + ['terms', 'slim_terms', 'term_count']
            for col in expected_columns:
                self.assertIn(col, result_df.columns)
            
            # Check data content
            row = result_df.iloc[0]
            self.assertEqual(row['gene_symbol'], 'RAET1E')
            self.assertEqual(row['term_count'], 2)  # Two different terms
            self.assertEqual(len(row['terms']), 2)
            
            # Check that evidence column is dropped
            self.assertNotIn('evidence', result_df.columns)
            
            # Check sorting (should be sorted by term_count descending)
            if len(result_df) > 1:
                for i in range(len(result_df) - 1):
                    self.assertGreaterEqual(result_df.iloc[i]['term_count'], 
                                          result_df.iloc[i + 1]['term_count'])
                                          
        finally:
            os.unlink(temp_file)

    def test_get_annos_with_multiple_genes(self):
        """Test get_annos function with multiple genes"""
        # Create data with multiple genes
        multiple_genes_data = self.sample_clean_annos + [
            {
                "gene": "UniProtKB:P56747",
                "term": {
                    "id": "GO:0008150",
                    "label": "biological process",
                    "aspect": "biological_process",
                    "is_goslim": False
                },
                "slim_terms": [],
                "evidence": [],
                "evidence_type": "unknown",
                "gene_symbol": "CLDN6",
                "gene_name": "Claudin-6",
                "taxon_id": "9606",
                "taxon_label": "Homo sapiens",
                "taxon_abbr": "Hsa",
                "panther_family": "PTHR12002",
                "long_id": "HUMAN|HGNC=2048|UniProtKB=P56747",
                "coordinates_chr_num": 16.0,
                "coordinates_start": 3014713.0,
                "coordinates_end": 3018170.0
            }
        ]
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(multiple_genes_data, f)
            temp_file = f.name
        
        try:
            result_df = get_annos(temp_file)
            
            # Should have two genes
            self.assertEqual(len(result_df), 2)
            
            # Check gene symbols
            gene_symbols = set(result_df['gene_symbol'])
            self.assertEqual(gene_symbols, {'RAET1E', 'CLDN6'})
            
            # Check sorting by term_count
            raet1e_row = result_df[result_df['gene_symbol'] == 'RAET1E'].iloc[0]
            cldn6_row = result_df[result_df['gene_symbol'] == 'CLDN6'].iloc[0]
            
            self.assertGreaterEqual(raet1e_row['term_count'], cldn6_row['term_count'])
            
        finally:
            os.unlink(temp_file)

    def test_integration_with_real_test_data(self):
        """Test with real test data files"""
        clean_annos_file = os.path.join(self.output_dir, 'human_iba_annotations_clean.json')
        
        if not os.path.exists(clean_annos_file):
            self.skipTest("Clean annotations test file not found")
        
        # Test with subset of real data to avoid long processing times
        with open(clean_annos_file, 'r') as f:
            real_data = json.load(f)
        
        # Use only first 10 annotations for testing
        sample_data = real_data[:10]
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(sample_data, f)
            temp_file = f.name
        
        try:
            result_df = get_annos(temp_file)
            
            # Basic checks
            self.assertIsInstance(result_df, pd.DataFrame)
            self.assertGreater(len(result_df), 0)
            
            # Check required columns
            expected_columns = COLUMNS_TO_EXTRACT + ['terms', 'slim_terms', 'term_count']
            for col in expected_columns:
                self.assertIn(col, result_df.columns)
            
            # Check data types and content
            for _, row in result_df.iterrows():
                self.assertIsInstance(row['terms'], list)
                self.assertIsInstance(row['slim_terms'], list)
                self.assertIsInstance(row['term_count'], (int, float))
                self.assertGreater(row['term_count'], 0)
                
        finally:
            os.unlink(temp_file)


class TestGenerateGeneAnnotationsArguments(unittest.TestCase):
    """Test argument parsing"""
    
    @patch('sys.argv', ['generate_gene_annotations.py', 
                        '-a', 'clean_annotations.json',
                        '-o', 'gene_annotations.json'])
    def test_parse_arguments(self):
        """Test argument parsing"""
        # Create temporary file to satisfy file_path validation
        temp_file = None
        try:
            # Create temporary file for input argument
            temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
            temp_file.write('[]')
            temp_file.close()
            
            # Update sys.argv with actual temp file path
            with patch('sys.argv', ['generate_gene_annotations.py', 
                                    '-a', temp_file.name,
                                    '-o', 'gene_annotations.json']):
                args = parse_arguments()
                
                self.assertEqual(args.annos_fp, temp_file.name)
                self.assertEqual(args.genes_annos_fp, 'gene_annotations.json')
                
        finally:
            # Clean up temp file
            if temp_file:
                try:
                    os.unlink(temp_file.name)
                except OSError:
                    pass


if __name__ == '__main__':
    unittest.main()
