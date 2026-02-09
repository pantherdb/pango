# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PAN-GO API is a FastAPI application providing a GraphQL API (via Strawberry GraphQL) for gene annotation data backed by Elasticsearch. It serves the PANTHER database project.

## Common Commands

```bash
# Install dependencies
poetry install

# Run development server (localhost:5000)
poetry run python main.py

# Run all tests
poetry run pytest

# Run specific test file
poetry run pytest tests/test_graphql_api.py -v

# Run single test
poetry run pytest tests/test_graphql_api.py::TestAnnotationResolver::test_get_annotation -v

# Run with coverage
poetry run pytest --cov=src
```

## Architecture

### Entry Point Flow
`main.py` → `src/app.py:create_app()` → FastAPI app with GraphQL router at `/graphql`

### Core Structure

**GraphQL Layer** (`src/graphql/`)
- `annotation_schema.py` - `FunctionomeQuery` defines all GraphQL query fields (annotations, genes, stats, autocomplete)
- `graphql_context.py` - `GraphQLContext` handles API versioning and index resolution

**Models** (`src/models/`) - Strawberry types and Pydantic input types
- `annotation_model.py` - `Annotation`, `AnnotationFilterArgs`, `GeneFilterArgs`
- `gene_model.py` - `Gene`, `GeneStats`
- `term_model.py` - `Term`, `TermStats`
- `evidence_model.py` - `Evidence` types
- `base_model.py` - Shared types: `PageArgs`, `ResultCount`, `Frequency`, `AutocompleteType`

**Resolvers** (`src/resolvers/`) - Elasticsearch query logic
- `annotation_resolver.py` - Main annotation/gene queries and exports
- `annotation_stats_resolver.py` - Annotation count queries
- `gene_stats_resolver.py` - Gene/term statistics aggregations
- `autocomplete_resolver.py` - Search autocomplete functionality

### API Versioning
The API supports multiple Elasticsearch index versions via the `GraphQLContext`. Versions are prefixed to index names (e.g., `pango-1-annotations`). Available versions are defined in `src/config/settings.py:ApiVersion`.

### Configuration
Environment variables (defined in `.env`, see `.env.example`):
- `PANGO_ES_URL` - Elasticsearch URL
- `PANGO_ANNOTATIONS_INDEX`, `PANGO_GENES_INDEX` - Base index names
- `HOST_URL`, `HOST_PORT` - Server binding

### GraphQL Patterns
- All query resolvers are async functions
- Filter arguments use `strawberry.UNSET` for optional fields
- Models use custom `__init__` to transform nested Elasticsearch data (e.g., `Term`, `Evidence`)


## Git

Do not add "Co-Authored-By" lines to commits.
