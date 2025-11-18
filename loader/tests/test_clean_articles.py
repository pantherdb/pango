import unittest
import os
import tempfile
import json
import shutil
from unittest.mock import patch, mock_open
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.clean_articles import (
    main, parse_arguments, parse_article, parse_articles, write_to_json
)


class TestCleanArticles(unittest.TestCase):
    
    def setUp(self):
        """Set up test data"""
        self.test_data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'test_data')
        
        # Sample article data in the format expected from PubMed API
        self.sample_article_data = {
            "result": {
                "uids": ["8138176", "11884604"],
                "8138176": {
                    "uid": "8138176",
                    "title": "Mutations in rik1, clr2, clr3 and clr4 genes asymmetrically derepress the silent mating-type loci in fission yeast.",
                    "pubdate": "1994 Jan",
                    "authors": [
                        {"name": "Ekwall K"},
                        {"name": "Ruusala T"}
                    ]
                },
                "11884604": {
                    "uid": "11884604",
                    "title": "Functional divergence between histone deacetylases in fission yeast by distinct cellular localization and in vivo specificity.",
                    "pubdate": "2002 Apr",
                    "authors": [
                        {"name": "Bjerling P"},
                        {"name": "Silverstein RA"},
                        {"name": "Thon G"}
                    ]
                }
            }
        }
        
        # Sample article data with missing/null authors
        self.sample_article_no_authors = {
            "result": {
                "uids": ["12345"],
                "12345": {
                    "uid": "12345",
                    "title": "Test article with no authors",
                    "pubdate": "2023 Jan",
                    "authors": None
                }
            }
        }

    def test_parse_article(self):
        """Test parse_article function"""
        article_data = self.sample_article_data["result"]["8138176"]
        result = parse_article(article_data)
        
        # Check basic structure
        self.assertIsInstance(result, dict)
        self.assertIn('pmid', result)
        self.assertIn('title', result)
        self.assertIn('date', result)
        self.assertIn('authors', result)
        
        # Check content
        self.assertEqual(result['pmid'], 'PMID:8138176')
        self.assertEqual(result['title'], 'Mutations in rik1, clr2, clr3 and clr4 genes asymmetrically derepress the silent mating-type loci in fission yeast.')
        self.assertEqual(result['date'], '1994 Jan')
        self.assertEqual(result['authors'], ['Ekwall K', 'Ruusala T'])

    def test_parse_article_no_authors(self):
        """Test parse_article function with no authors"""
        article_data = self.sample_article_no_authors["result"]["12345"]
        result = parse_article(article_data)
        
        # Should handle missing authors gracefully
        self.assertIsInstance(result, dict)
        self.assertEqual(result['pmid'], 'PMID:12345')
        self.assertEqual(result['title'], 'Test article with no authors')
        self.assertEqual(result['date'], '2023 Jan')
        self.assertNotIn('authors', result)  # Should not be included if None

    def test_parse_article_empty_authors(self):
        """Test parse_article function with empty authors list"""
        article_data = {
            "uid": "12345",
            "title": "Test article",
            "pubdate": "2023 Jan",
            "authors": []
        }
        result = parse_article(article_data)
        
        # Should handle empty authors list - the function includes empty list
        self.assertIsInstance(result, dict)
        self.assertEqual(result['pmid'], 'PMID:12345')
        self.assertEqual(result['title'], 'Test article')
        self.assertEqual(result['date'], '2023 Jan')
        self.assertIn('authors', result)  # Empty list is still included
        self.assertEqual(result['authors'], [])

    def test_write_to_json(self):
        """Test write_to_json function"""
        test_data = [
            {"pmid": "PMID:123", "title": "Test article 1"},
            {"pmid": "PMID:456", "title": "Test article 2"}
        ]
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_file = f.name
        
        try:
            write_to_json(test_data, temp_file)
            
            # Verify file was written correctly
            self.assertTrue(os.path.exists(temp_file))
            
            with open(temp_file, 'r', encoding='utf-8') as f:
                loaded_data = json.load(f)
            
            self.assertEqual(loaded_data, test_data)
            
        finally:
            os.unlink(temp_file)

    def test_parse_articles(self):
        """Test parse_articles function"""
        # Create a temporary directory with test JSON files
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create test article files
            article_file1 = os.path.join(temp_dir, 'articles-1.json')
            article_file2 = os.path.join(temp_dir, 'articles-2.json')
            non_json_file = os.path.join(temp_dir, 'readme.txt')
            
            # Write test data to files
            with open(article_file1, 'w', encoding='utf-8') as f:
                json.dump(self.sample_article_data, f)
            
            with open(article_file2, 'w', encoding='utf-8') as f:
                json.dump(self.sample_article_no_authors, f)
            
            # Create a non-JSON file (should be ignored)
            with open(non_json_file, 'w') as f:
                f.write("This is not a JSON file")
            
            # Create output file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                output_file = f.name
            
            try:
                # Test parsing
                parse_articles(temp_dir, output_file)
                
                # Verify output
                self.assertTrue(os.path.exists(output_file))
                
                with open(output_file, 'r', encoding='utf-8') as f:
                    result = json.load(f)
                
                # Should have 3 articles total (2 from first file, 1 from second)
                self.assertEqual(len(result), 3)
                
                # Check that all articles have expected structure
                for article in result:
                    self.assertIn('pmid', article)
                    self.assertIn('title', article)
                    self.assertIn('date', article)
                    self.assertTrue(article['pmid'].startswith('PMID:'))
                
                # Check specific articles
                pmids = [article['pmid'] for article in result]
                self.assertIn('PMID:8138176', pmids)
                self.assertIn('PMID:11884604', pmids)
                self.assertIn('PMID:12345', pmids)
                
            finally:
                os.unlink(output_file)

    def test_parse_articles_empty_directory(self):
        """Test parse_articles function with empty directory"""
        with tempfile.TemporaryDirectory() as temp_dir:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                output_file = f.name
            
            try:
                parse_articles(temp_dir, output_file)
                
                # Should create an empty file with empty list
                self.assertTrue(os.path.exists(output_file))
                
                with open(output_file, 'r', encoding='utf-8') as f:
                    result = json.load(f)
                
                self.assertEqual(result, [])
                
            finally:
                os.unlink(output_file)

    def test_parse_articles_with_subdirectories(self):
        """Test parse_articles function with subdirectories"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create a subdirectory with JSON files
            sub_dir = os.path.join(temp_dir, 'subdir')
            os.makedirs(sub_dir)
            
            article_file = os.path.join(sub_dir, 'articles.json')
            with open(article_file, 'w', encoding='utf-8') as f:
                json.dump(self.sample_article_data, f)
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                output_file = f.name
            
            try:
                parse_articles(temp_dir, output_file)
                
                with open(output_file, 'r', encoding='utf-8') as f:
                    result = json.load(f)
                
                # Should find files in subdirectories
                self.assertEqual(len(result), 2)
                
            finally:
                os.unlink(output_file)

    def test_integration_with_real_test_data(self):
        """Test with real test data structure"""
        downloads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'downloads', 'articles')
        
        if not os.path.exists(downloads_dir):
            self.skipTest("Downloads articles directory not found")
        
        # Look for any JSON files in the articles directory
        json_files = [f for f in os.listdir(downloads_dir) if f.endswith('.json')]
        
        if not json_files:
            self.skipTest("No article JSON files found in downloads directory")
        
        # Test with first few files only to avoid long processing
        test_files = json_files[:3]
        
        with tempfile.TemporaryDirectory() as temp_dir:
            # Copy a few test files to temporary directory
            for file_name in test_files:
                src = os.path.join(downloads_dir, file_name)
                dst = os.path.join(temp_dir, file_name)
                shutil.copy2(src, dst)
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                output_file = f.name
            
            try:
                parse_articles(temp_dir, output_file)
                
                # Verify output exists and has content
                self.assertTrue(os.path.exists(output_file))
                
                with open(output_file, 'r', encoding='utf-8') as f:
                    result = json.load(f)
                
                # Should have some articles
                self.assertIsInstance(result, list)
                
                # Check structure of first article if any exist
                if result:
                    article = result[0]
                    self.assertIn('pmid', article)
                    self.assertIn('title', article)
                    self.assertIn('date', article)
                    self.assertTrue(article['pmid'].startswith('PMID:'))
                
            finally:
                os.unlink(output_file)


class TestCleanArticlesArguments(unittest.TestCase):
    """Test argument parsing"""
    
    @patch('sys.argv', ['clean_articles.py', 
                        '-i', '/path/to/input/dir',
                        '-o', 'output.json'])
    def test_parse_arguments(self):
        """Test argument parsing"""
        # Create temporary directory to satisfy dir_path validation
        temp_dir = None
        try:
            # Create temporary directory for input argument
            temp_dir = tempfile.mkdtemp()
            
            # Update sys.argv with actual temp directory path
            with patch('sys.argv', ['clean_articles.py', 
                                    '-i', temp_dir,
                                    '-o', 'output.json']):
                args = parse_arguments()
                
                self.assertEqual(args.in_dir, temp_dir)
                self.assertEqual(args.out_fp, 'output.json')
                
        finally:
            # Clean up temp directory
            if temp_dir:
                try:
                    shutil.rmtree(temp_dir)
                except OSError:
                    pass


class TestCleanArticlesErrorHandling(unittest.TestCase):
    """Test error handling scenarios"""
    
    def test_parse_article_malformed_data(self):
        """Test parse_article with malformed data"""
        # Test with missing required fields
        malformed_data = {
            "uid": "12345",
            # Missing title, pubdate
        }
        
        # Should handle gracefully and not crash
        try:
            result = parse_article(malformed_data)
            # Check that basic structure is maintained
            self.assertIn('pmid', result)
            self.assertEqual(result['pmid'], 'PMID:12345')
        except KeyError:
            # It's acceptable to raise KeyError for required fields
            pass

    def test_parse_articles_invalid_json(self):
        """Test parse_articles with invalid JSON files"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create a file with invalid JSON
            invalid_json_file = os.path.join(temp_dir, 'invalid.json')
            with open(invalid_json_file, 'w') as f:
                f.write('{ invalid json }')
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                output_file = f.name
            
            try:
                # Should handle invalid JSON gracefully (might raise exception or skip)
                # The exact behavior depends on implementation
                parse_articles(temp_dir, output_file)
                
                # If it completes, verify output file exists
                self.assertTrue(os.path.exists(output_file))
                
            except json.JSONDecodeError:
                # It's acceptable to raise JSON decode error
                pass
            finally:
                if os.path.exists(output_file):
                    os.unlink(output_file)


if __name__ == '__main__':
    unittest.main()
