import pytest
import os
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

# Set up environment variables for testing
os.environ.setdefault("DEBUG", "False")
os.environ.setdefault("PANGO_ES_URL", "http://localhost:9200")
os.environ.setdefault("PANGO_ANNOTATIONS_INDEX", "test_annotations")
os.environ.setdefault("PANGO_GENES_INDEX", "test_genes")
os.environ.setdefault("HOST_URL", "localhost")
os.environ.setdefault("HOST_PORT", "8000")

from src.app import create_app


class TestBasicGraphQL:
    """Basic GraphQL API tests"""
    
    @pytest.fixture
    def app(self):
        """Create FastAPI test app"""
        return create_app()
    
    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return TestClient(app)

    def test_graphql_endpoint_exists(self, client):
        """Test that GraphQL endpoint is accessible"""
        response = client.post("/graphql", json={
            "query": "{ __schema { types { name } } }"
        })
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "__schema" in data["data"]

    def test_graphql_introspection(self, client):
        """Test GraphQL introspection query"""
        query = """
        query IntrospectionQuery {
            __schema {
                queryType {
                    name
                    fields {
                        name
                        type {
                            name
                        }
                    }
                }
            }
        }
        """
        
        response = client.post("/graphql", json={"query": query})
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "__schema" in data["data"]
        
        query_type = data["data"]["__schema"]["queryType"]
        field_names = [field["name"] for field in query_type["fields"]]
        
        # Check that all expected fields are present
        expected_fields = [
            "annotation", "annotations", "genes", "annotationsExport",
            "annotationsCount", "genesCount", "geneStats", "autocomplete",
            "slimTermsAutocomplete"
        ]
        
        for field in expected_fields:
            assert field in field_names

    def test_invalid_query_error_handling(self, client):
        """Test error handling for invalid GraphQL queries"""
        invalid_query = """
        query InvalidQuery {
            nonExistentField {
                id
            }
        }
        """
        
        response = client.post("/graphql", json={"query": invalid_query})
        assert response.status_code == 200  # GraphQL returns 200 even for errors
        data = response.json()
        assert "errors" in data

    def test_malformed_query_error_handling(self, client):
        """Test error handling for malformed GraphQL queries"""
        malformed_query = """
        query MalformedQuery {
            annotation(id: "test") {
                id
                # Missing closing brace
        """
        
        response = client.post("/graphql", json={"query": malformed_query})
        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    @patch('src.resolvers.annotation_stats_resolver.get_annotations_count')
    def test_annotations_count_query(self, mock_get_count, client):
        """Test annotations count query"""
        from src.models.base_model import ResultCount
        mock_get_count.return_value = ResultCount(total=100)
        
        query = """
        query GetAnnotationsCount($filterArgs: AnnotationFilterArgs) {
            annotationsCount(filterArgs: $filterArgs) {
                total
            }
        }
        """
        
        variables = {
            "filterArgs": {
                "taxonId": "9606"
            }
        }
        
        response = client.post("/graphql", json={
            "query": query,
            "variables": variables
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["annotationsCount"]["total"] == 100

    @patch('src.resolvers.gene_stats_resolver.get_genes_count')
    def test_genes_count_query(self, mock_get_count, client):
        """Test genes count query"""
        from src.models.base_model import ResultCount
        mock_get_count.return_value = ResultCount(total=50)
        
        query = """
        query GetGenesCount($filterArgs: GeneFilterArgs) {
            genesCount(filterArgs: $filterArgs) {
                total
            }
        }
        """
        
        response = client.post("/graphql", json={
            "query": query
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["genesCount"]["total"] == 50

    def test_cors_headers(self, client):
        """Test CORS headers are properly set"""
        response = client.options("/graphql")
        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == "*"


if __name__ == "__main__":
    pytest.main([__file__])
