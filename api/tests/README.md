# GraphQL API Testing Documentation

This directory contains comprehensive tests for the Pango GraphQL API. The tests are organized into multiple files to cover different aspects of the API.

## Test Files

### 1. `test_basic_graphql.py`
Basic GraphQL functionality tests:
- GraphQL endpoint accessibility
- Schema introspection
- Error handling for invalid queries
- CORS headers verification
- Basic count queries

### 2. `test_graphql_resolvers.py`
Individual resolver tests with mocked data:
- Annotation queries (single and list)
- Gene queries
- Count queries (annotations and genes)
- Export functionality
- Statistics queries
- Autocomplete functionality

### 3. `test_graphql_api.py`
Comprehensive integration tests:
- Full GraphQL queries with complex data structures
- Filter arguments testing
- Pagination testing
- Nested object queries
- Unit tests for resolver classes
- Integration tests for multiple resolvers

## Test Structure

Each test file follows these patterns:

### Fixtures
- `app`: Creates the FastAPI application instance
- `client`: Creates a test client for making HTTP requests
- `mock_context`: Mocks the GraphQL context
- Sample data fixtures for testing

### Test Categories

1. **Basic Functionality Tests**
   - Endpoint availability
   - Schema validation
   - Error handling

2. **Resolver Tests**
   - Individual resolver functionality
   - Mocked data responses
   - Parameter passing

3. **Integration Tests**
   - Full query execution
   - Data transformation
   - Complex nested queries

## Running Tests

### Run all tests:
```bash
python -m pytest tests/ -v
```

### Run specific test file:
```bash
python -m pytest tests/test_basic_graphql.py -v
```

### Run specific test:
```bash
python -m pytest tests/test_basic_graphql.py::TestBasicGraphQL::test_graphql_endpoint_exists -v
```

### Run tests with coverage:
```bash
python -m pytest tests/ --cov=src --cov-report=html
```

## Test Data

The tests use mock data that represents typical API responses:
- Annotation objects with genes, terms, and evidence
- Gene objects with associated terms
- Statistical data for frequency analysis
- Autocomplete results

## Environment Setup

Tests automatically set up required environment variables:
- `PANGO_ES_URL`: Elasticsearch URL
- `PANGO_ANNOTATIONS_INDEX`: Annotations index name
- `PANGO_GENES_INDEX`: Genes index name
- `HOST_URL` and `HOST_PORT`: API host configuration

## Mocking Strategy

The tests use `unittest.mock` to mock external dependencies:
- Elasticsearch queries
- Resolver functions
- Database connections
- External API calls

This ensures tests run quickly and don't depend on external services.

## GraphQL Query Examples

### Basic Count Query
```graphql
query {
    annotationsCount {
        total
    }
}
```

### Annotation with Filters
```graphql
query GetAnnotations($filterArgs: AnnotationFilterArgs) {
    annotations(filterArgs: $filterArgs) {
        id
        gene
        geneSymbol
        term {
            id
            label
        }
    }
}
```

### Complex Nested Query
```graphql
query {
    annotations(pageArgs: {limit: 10}) {
        id
        gene
        term {
            id
            label
            aspect
        }
        slimTerms {
            id
            label
        }
        evidence {
            withGeneId {
                gene
                geneSymbol
            }
            references {
                pmid
                title
            }
        }
    }
}
```

## Adding New Tests

When adding new tests:

1. Follow the existing naming convention
2. Use appropriate fixtures
3. Mock external dependencies
4. Test both success and error cases
5. Include parameter validation tests
6. Add integration tests for complex scenarios

## Test Dependencies

Required packages:
- `pytest`: Testing framework
- `pytest-asyncio`: Async test support
- `pytest-mock`: Enhanced mocking capabilities
- `httpx`: HTTP client for testing
- `fastapi.testclient`: FastAPI testing utilities
