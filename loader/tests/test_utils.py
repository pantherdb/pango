import unittest
import os
import tempfile
import json
import gzip
import pandas as pd
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.utils import write_to_json, load_json, get_pd_row, get_pd_row_key


class TestUtils(unittest.TestCase):
    
    def setUp(self):
        """Set up test data"""
        self.test_data = {
            "test_key": "test_value",
            "number": 42,
            "list": [1, 2, 3],
            "nested": {"inner": "value"}
        }
        
        # Sample DataFrame for testing pandas functions
        self.sample_df = pd.DataFrame({
            'id': ['A', 'B', 'C'],
            'name': ['Alice', 'Bob', 'Charlie'],
            'age': [25, 30, None],  # Include NaN for testing dropna
            'city': ['New York', 'London', 'Tokyo']
        })
        self.sample_df = self.sample_df.set_index('id')

    def test_write_to_json_regular(self):
        """Test write_to_json function with regular JSON"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_file = f.name
        
        try:
            write_to_json(self.test_data, temp_file)
            
            # Verify file exists
            self.assertTrue(os.path.exists(temp_file))
            
            # Verify content
            with open(temp_file, 'r', encoding='utf-8') as f:
                loaded_data = json.load(f)
            
            self.assertEqual(loaded_data, self.test_data)
            
        finally:
            os.unlink(temp_file)

    def test_write_to_json_with_indent(self):
        """Test write_to_json function with indentation"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_file = f.name
        
        try:
            write_to_json(self.test_data, temp_file, indent=2)
            
            # Verify file exists and is formatted
            self.assertTrue(os.path.exists(temp_file))
            
            with open(temp_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check that it's indented (contains newlines and spaces)
            self.assertIn('\n', content)
            self.assertIn('  ', content)  # Should have 2-space indentation
            
            # Verify data integrity
            loaded_data = json.loads(content)
            self.assertEqual(loaded_data, self.test_data)
            
        finally:
            os.unlink(temp_file)

    def test_write_to_json_compressed(self):
        """Test write_to_json function with compression"""
        with tempfile.NamedTemporaryFile(suffix='.json.gz', delete=False) as f:
            temp_file = f.name
        
        try:
            write_to_json(self.test_data, temp_file, zip=True)
            
            # Verify file exists
            self.assertTrue(os.path.exists(temp_file))
            
            # Verify it's compressed and content is correct
            with gzip.open(temp_file, 'rt', encoding='utf-8') as f:
                loaded_data = json.load(f)
            
            self.assertEqual(loaded_data, self.test_data)
            
        finally:
            os.unlink(temp_file)

    def test_write_to_json_unicode(self):
        """Test write_to_json function with unicode characters"""
        unicode_data = {
            "unicode_text": "Hello 世界 🌍",
            "accents": "café naïve résumé",
            "symbols": "α β γ δ ε"
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_file = f.name
        
        try:
            write_to_json(unicode_data, temp_file)
            
            # Verify unicode is preserved
            with open(temp_file, 'r', encoding='utf-8') as f:
                loaded_data = json.load(f)
            
            self.assertEqual(loaded_data, unicode_data)
            self.assertEqual(loaded_data["unicode_text"], "Hello 世界 🌍")
            
        finally:
            os.unlink(temp_file)

    def test_load_json(self):
        """Test load_json function"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(self.test_data, f)
            temp_file = f.name
        
        try:
            loaded_data = load_json(temp_file)
            self.assertEqual(loaded_data, self.test_data)
            
        finally:
            os.unlink(temp_file)

    def test_load_json_unicode(self):
        """Test load_json function with unicode content"""
        unicode_data = {
            "text": "Hello 世界",
            "math": "π = 3.14159"
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8') as f:
            json.dump(unicode_data, f, ensure_ascii=False)
            temp_file = f.name
        
        try:
            loaded_data = load_json(temp_file)
            self.assertEqual(loaded_data, unicode_data)
            
        finally:
            os.unlink(temp_file)

    def test_get_pd_row(self):
        """Test get_pd_row function"""
        result = get_pd_row(self.sample_df, 'A')
        
        # Should return a dictionary
        self.assertIsInstance(result, dict)
        
        # Should have all non-null values (index is not included in dropna result)
        self.assertIn('name', result)
        self.assertIn('age', result)
        self.assertIn('city', result)
        self.assertEqual(result['name'], 'Alice')
        self.assertEqual(result['city'], 'New York')
        # Age might be float64 from pandas
        self.assertEqual(float(result['age']), 25.0)

    def test_get_pd_row_with_nan(self):
        """Test get_pd_row function with NaN values"""
        result = get_pd_row(self.sample_df, 'C')
        
        # Should exclude NaN values
        self.assertIn('name', result)
        self.assertIn('city', result)
        self.assertEqual(result['name'], 'Charlie')
        self.assertEqual(result['city'], 'Tokyo')
        # age should be excluded because it's NaN
        self.assertNotIn('age', result)

    def test_get_pd_row_nonexistent_key(self):
        """Test get_pd_row function with non-existent key"""
        with self.assertRaises(KeyError):
            get_pd_row(self.sample_df, 'Z')

    def test_get_pd_row_key(self):
        """Test get_pd_row_key function"""
        result = get_pd_row_key(self.sample_df, 'B')
        
        # Should return a dictionary
        self.assertIsInstance(result, dict)
        
        # Check key values
        self.assertIn('name', result)
        self.assertIn('age', result)
        self.assertIn('city', result)
        self.assertEqual(result['name'], 'Bob')
        self.assertEqual(result['city'], 'London')
        # Age might be float64 from pandas
        self.assertEqual(float(result['age']), 30.0)

    def test_get_pd_row_key_nonexistent(self):
        """Test get_pd_row_key function with non-existent key"""
        result = get_pd_row_key(self.sample_df, 'Z')
        
        # Should return None instead of raising an error
        self.assertIsNone(result)

    def test_get_pd_row_key_with_nan(self):
        """Test get_pd_row_key function with NaN values"""
        result = get_pd_row_key(self.sample_df, 'C')
        
        # Should exclude NaN values
        self.assertIn('name', result)
        self.assertIn('city', result)
        self.assertEqual(result['name'], 'Charlie')
        self.assertEqual(result['city'], 'Tokyo')
        self.assertNotIn('age', result)

    def test_pandas_functions_with_complex_data(self):
        """Test pandas functions with more complex DataFrame"""
        complex_df = pd.DataFrame({
            'id': ['X1', 'X2', 'X3'],
            'data': [
                {'nested': 'value1'},
                {'nested': 'value2'},
                None
            ],
            'numbers': [1.5, None, 3.7],
            'lists': [
                [1, 2, 3],
                [],
                [4, 5]
            ]
        })
        complex_df = complex_df.set_index('id')
        
        # Test with complex data types
        result = get_pd_row_key(complex_df, 'X1')
        
        # Check key values individually
        self.assertIn('data', result)
        self.assertIn('numbers', result) 
        self.assertIn('lists', result)
        self.assertEqual(result['data'], {'nested': 'value1'})
        self.assertEqual(float(result['numbers']), 1.5)
        self.assertEqual(result['lists'], [1, 2, 3])
        
        # Test with missing/null complex data
        result = get_pd_row_key(complex_df, 'X3')
        
        # Check values - X3 has numbers=3.7 and lists=[4,5], but data=None
        self.assertIn('lists', result)
        self.assertIn('numbers', result)  # X3 has numbers=3.7, not None
        self.assertEqual(result['lists'], [4, 5])
        self.assertEqual(float(result['numbers']), 3.7)
        # data should be excluded (None)
        self.assertNotIn('data', result)

    def test_integration_with_test_data(self):
        """Test utils functions with actual test data"""
        test_data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'test_data')
        articles_file = os.path.join(test_data_dir, 'clean-articles.json')
        
        if os.path.exists(articles_file):
            # Test loading real data
            data = load_json(articles_file)
            self.assertIsInstance(data, list)
            
            if data:  # If there's data
                # Test that each article has expected structure
                article = data[0]
                self.assertIn('pmid', article)
                self.assertIn('title', article)
                
                # Test round-trip with write_to_json
                with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                    temp_file = f.name
                
                try:
                    write_to_json(data[:5], temp_file, indent=2)  # Test with first 5 articles
                    reloaded_data = load_json(temp_file)
                    self.assertEqual(reloaded_data, data[:5])
                    
                finally:
                    os.unlink(temp_file)


class TestUtilsErrorHandling(unittest.TestCase):
    """Test error handling in utils functions"""
    
    def test_load_json_file_not_found(self):
        """Test load_json with non-existent file"""
        with self.assertRaises(FileNotFoundError):
            load_json('/path/to/nonexistent/file.json')

    def test_load_json_invalid_json(self):
        """Test load_json with invalid JSON"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write('{ invalid json content }')
            temp_file = f.name
        
        try:
            with self.assertRaises(json.JSONDecodeError):
                load_json(temp_file)
        finally:
            os.unlink(temp_file)

    def test_write_to_json_invalid_path(self):
        """Test write_to_json with invalid output path"""
        with self.assertRaises((OSError, IOError, FileNotFoundError)):
            write_to_json({'test': 'data'}, '/invalid/path/that/does/not/exist/file.json')


if __name__ == '__main__':
    unittest.main()
