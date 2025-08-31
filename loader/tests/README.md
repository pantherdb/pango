# Panther Pango Loader Tests

## Running Tests

### Option 1: Using Test Runner Scripts

```bash

# Run all tests
./tests/run_tests.sh

# Run specific test modules
./tests/run_tests.sh utils
./tests/run_tests.sh articles
./tests/run_tests.sh annotations
./tests/run_tests.sh genes

# Show help
./tests/run_tests.sh help
```

### Option 2: Using Python unittest directly

#### Run all tests
```bash
python -m unittest discover tests -v
```

#### Run specific test modules
```bash
python -m unittest tests.test_utils -v
python -m unittest tests.test_clean_articles -v
```

#### Run specific test classes
```bash
python -m unittest tests.test_utils.TestUtils -v
python -m unittest tests.test_clean_articles.TestCleanArticles -v
```

#### Run specific test methods
```bash
python -m unittest tests.test_utils.TestUtils.test_write_to_json_regular -v
```

### Option 3: Using pytest
```bash
# Install pytest
pip install pytest

# Run all tests
pytest tests/ -v

# Run specific modules
pytest tests/test_utils.py -v
pytest tests/test_clean_articles.py -v
```

## Test Data

Tests use sample data located in the `test_data/` directory:

- `test_data/input/pango-test/` - Sample input files
  - `full_go_annotated.json` - GO terms data
  - `human_iba_annotations.json` - Sample annotations
  - `human_iba_gene_info.json` - Gene information
  - `taxon_lkp.json` - Taxon lookup data
- `test_data/output/pango-test/` - Expected output files
- `test_data/clean-articles.json` - Sample clean articles

## Test Coverage

### test_clean_annotations.py
Tests for the clean_annotations module:

- ✅ **Term processing**: `term_type()`, `spread_terms()`, `get_aspect()`
- ✅ **Data loading**: `get_terms_map()`, `get_articles_map()`, `get_taxon_map()`, `get_genes_map()`
- ✅ **Evidence processing**: `get_evidence()`, `count_evidence()`, `get_groups()`
- ✅ **Main workflow**: `get_annos()` with sample and real test data
- ✅ **Argument parsing**: Command line argument validation
- ✅ **Integration tests**: End-to-end testing with real test data

### test_generate_gene_annotations.py

Tests for the generate_gene_annotations module:

- ✅ **Term uniquification**: `uniquify_term()`, `uniquify_slim_terms()`
- ✅ **Data grouping**: `group_terms()` for gene-level aggregation
- ✅ **Main workflow**: `get_annos()` with sample and multiple gene data
- ✅ **Duplicate handling**: Error handling for duplicate terms
- ✅ **Column extraction**: Verification of required columns
- ✅ **Integration tests**: Testing with real clean annotation data

### test_clean_articles.py

Tests for the clean_articles module:

- ✅ **Article parsing**: `parse_article()` with various input formats
- ✅ **Batch processing**: `parse_articles()` for directory processing
- ✅ **File handling**: JSON file processing and subdirectory traversal
- ✅ **Error handling**: Malformed data, missing files, invalid JSON
- ✅ **Author processing**: Handling of missing/null/empty authors
- ✅ **Unicode support**: Proper handling of international characters
- ✅ **Integration tests**: Testing with real article data structure

### test_utils.py

Tests for the utils module:

- ✅ **JSON I/O**: `write_to_json()`, `load_json()` with various options
- ✅ **Compression**: Gzip compression support
- ✅ **Unicode handling**: International character support
- ✅ **Pandas utilities**: `get_pd_row()`, `get_pd_row_key()` with DataFrames
- ✅ **NaN handling**: Proper handling of missing/null values
- ✅ **Error handling**: File not found, invalid JSON, invalid paths
- ✅ **Complex data types**: Nested objects, lists, numeric data

## Test Patterns

### Mocking and Isolation

Tests use Python's `unittest.mock` for:

- File system operations
- Command line argument parsing
- External dependencies

### Temporary Files

Tests use `tempfile` module for:

- Creating temporary test files
- Avoiding pollution of file system
- Clean up after test execution

### Real Data Integration

Tests include integration tests that use:

- Real test data files from `test_data/`
- Subset sampling for performance
- Optional skipping if test data not available

### Error Scenarios

Tests cover error conditions including:

- Missing files
- Invalid JSON
- Malformed data
- Edge cases (empty data, null values)
