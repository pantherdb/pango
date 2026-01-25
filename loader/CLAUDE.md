# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Elasticsearch data loader for the PAN-GO Humana Functionome site. Processes gene ontology annotations, fetches PubMed article metadata, and indexes data into Elasticsearch.

## Common Commands

### Start/Stop Elasticsearch
```bash
docker-compose up -d       # Start Elasticsearch (localhost:9200)
docker-compose down        # Stop Elasticsearch
```

### Run Full Pipeline
```bash
bash scripts/all.sh -i ./downloads/input -a ./downloads/clean-articles.json -o ./downloads/output
```

### Run Individual Modules
```bash
# Fetch PubMed article metadata
python3 -m src.get_articles -a <annotations.json> -o <output.json> -e <existing_articles.json>

# Clean and process annotations
python3 -m src.clean_annotations -a <annotations.json> -t <terms.json> -tax <taxon.json> -art <articles.json> -g <genes.json> -o <output.json>

# Generate gene-level aggregations
python3 -m src.generate_gene_annotations -a <clean_annotations.json> -o <output.json>

# Index to Elasticsearch
python3 -m src.index_es -a <annotations.json> -g <genes.json> -p <index_prefix>
```

### Run Tests
```bash
./tests/run_tests.sh                    # Run all tests
./tests/run_tests.sh utils              # Run specific module (utils, articles, annotations, genes)
python -m unittest discover tests -v    # Using unittest directly
pytest tests/ -v                        # Using pytest
python -m unittest tests.test_utils.TestUtils.test_write_to_json_regular -v  # Single test method
```

## Architecture

### Data Processing Pipeline
1. **get_articles.py** - Extracts PMIDs from annotations, fetches metadata from NCBI eUtils API (batches of 100 with rate limiting)
2. **clean_annotations.py** - Joins annotations with terms, genes, articles, and taxon data; computes evidence counts and groups
3. **generate_gene_annotations.py** - Groups annotations by gene, aggregates terms and slim_terms, calculates sort_priority
4. **index_es.py** - Bulk loads processed data into Elasticsearch using streaming JSON parser (ijson)

### Key Data Structures
- **UNKNOWN_TERMS**: `['UNKNOWN:0001', 'UNKNOWN:0002', 'UNKNOWN:0003']` - Special term IDs handled separately
- **TableAggType**: Enum for index types (`ANNOTATIONS`, `GENES`)
- **sort_priority**: Named genes get priority 1, unnamed genes get priority 20

### Configuration
- Environment: `.env` file (copy from `.env-example`)
- ES mappings: `data/es_settings/` (annotations_mappings.json, genes_mappings.json, settings.json)
- Settings loaded via pydantic in `src/config/settings.py`

### Input Data Format
Each dataset folder requires:
- `full_go_annotated.json` - GO terms
- `human_iba_annotations.json` - Annotations
- `human_iba_gene_info.json` - Gene information
- `taxon_lkp.json` - Taxon lookup

### Test Data
Located in `test_data/input/pango-test/` and `test_data/output/pango-test/`

## Git

Do not add "Co-Authored-By" lines to commits.