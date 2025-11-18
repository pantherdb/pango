import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock, patch
from strawberry.types import Info
import json
import os

# Set up environment variables for testing
os.environ.setdefault("DEBUG", "False")
os.environ.setdefault("PANGO_ES_URL", "http://localhost:9200")
os.environ.setdefault("PANGO_ANNOTATIONS_INDEX", "test_annotations")
os.environ.setdefault("PANGO_GENES_INDEX", "test_genes")
os.environ.setdefault("HOST_URL", "localhost")
os.environ.setdefault("HOST_PORT", "8000")

from src.app import create_app
from src.graphql.annotation_schema import FunctionomeQuery
from src.graphql.graphql_context import GraphQLContext
from src.models.annotation_model import Annotation, AnnotationFilterArgs, AnnotationStats, AnnotationExport, GeneFilterArgs
from src.models.gene_model import Gene, GeneStats
from src.models.base_model import PageArgs, ResultCount, AutocompleteType
from src.models.term_model import Term
from src.models.evidence_model import Evidence


class TestGraphQLAPI:
    """Test suite for the GraphQL API"""
    
    @pytest.fixture
    def app(self):
        """Create FastAPI test app"""
        return create_app()
    
    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def mock_context(self):
        """Mock GraphQL context"""
        context = Mock(spec=GraphQLContext)
        context.get_index.return_value = Mock()
        return context
    
    @pytest.fixture
    def mock_info(self, mock_context):
        """Mock GraphQL Info object"""
        info = Mock(spec=Info)
        info.context = mock_context
        return info
    
    @pytest.fixture
    def sample_annotation(self):
        """Sample annotation data for testing"""
        return {
            "id": "test_annotation_1",
            "gene": "BRCA1",
            "gene_symbol": "BRCA1",
            "gene_name": "BRCA1 DNA repair associated",
            "long_id": "HGNC:1100",
            "panther_family": "PTHR24416",
            "taxon_abbr": "HUMAN",
            "taxon_label": "Homo sapiens",
            "taxon_id": "9606",
            "coordinates_chr_num": "17",
            "coordinates_start": 43044295,
            "coordinates_end": 43125483,
            "coordinates_strand": -1,
            "term_type": "molecular_function",
            "term": {
                "id": "GO:0003677",
                "label": "DNA binding",
                "aspect": "molecular_function",
                "display_id": "GO:0003677"
            },
            "slim_terms": [
                {
                    "id": "GO:0003677",
                    "label": "DNA binding",
                    "aspect": "molecular_function",
                    "display_id": "GO:0003677"
                }
            ],
            "evidence_type": "IEA",
            "evidence": [
                {
                    "with_gene_id": {
                        "gene": "BRCA1",
                        "gene_symbol": "BRCA1", 
                        "taxon_abbr": "HUMAN",
                        "terms": [],
                        "slim_terms": []
                    },
                    "references": []
                }
            ],
            "groups": ["DNA_REPAIR"],
            "evidence_count": 1
        }
    
    @pytest.fixture
    def sample_gene(self):
        """Sample gene data for testing"""
        return {
            "gene": "BRCA1",
            "gene_symbol": "BRCA1",
            "gene_name": "BRCA1 DNA repair associated",
            "long_id": "HGNC:1100",
            "panther_family": "PTHR24416",
            "taxon_abbr": "HUMAN",
            "taxon_label": "Homo sapiens",
            "taxon_id": "9606",
            "coordinates_chr_num": "17",
            "coordinates_start": 43044295,
            "coordinates_end": 43125483,
            "coordinates_strand": -1,
            "terms": [
                {
                    "id": "GO:0003677",
                    "label": "DNA binding",
                    "aspect": "molecular_function",
                    "display_id": "GO:0003677"
                }
            ],
            "slim_terms": [
                {
                    "id": "GO:0003677",
                    "label": "DNA binding",
                    "aspect": "molecular_function",
                    "display_id": "GO:0003677"
                }
            ],
            "term_count": 5
        }

    def test_graphql_endpoint_exists(self, client):
        """Test that GraphQL endpoint is accessible"""
        response = client.post("/graphql", json={
            "query": "{ __schema { types { name } } }"
        })
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "__schema" in data["data"]

    @patch('src.resolvers.annotation_resolver.get_annotation')
    def test_annotation_query(self, mock_get_annotation, client, sample_annotation):
        """Test single annotation query"""
        mock_get_annotation.return_value = Annotation(**sample_annotation)
        
        query = """
        query GetAnnotation($id: String!) {
            annotation(id: $id) {
                id
                gene
                geneSymbol
                geneName
                taxonAbbr
                taxonLabel
                term {
                    id
                    label
                    aspect
                }
            }
        }
        """
        
        variables = {"id": "test_annotation_1"}
        response = client.post("/graphql", json={
            "query": query,
            "variables": variables
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "annotation" in data["data"]
        annotation = data["data"]["annotation"]
        assert annotation["id"] == "test_annotation_1"
        assert annotation["gene"] == "BRCA1"
        assert annotation["geneSymbol"] == "BRCA1"

    @patch('src.resolvers.annotation_resolver.get_annotations')
    def test_annotations_query_with_filters(self, mock_get_annotations, client, sample_annotation):
        """Test annotations query with filter arguments"""
        mock_get_annotations.return_value = [Annotation(**sample_annotation)]
        
        query = """
        query GetAnnotations($filterArgs: AnnotationFilterArgs, $pageArgs: PageArgs) {
            annotations(filterArgs: $filterArgs, pageArgs: $pageArgs) {
                id
                gene
                geneSymbol
                taxonAbbr
                term {
                    id
                    label
                }
            }
        }
        """
        
        variables = {
            "filterArgs": {
                "gene": "BRCA1",
                "taxonId": "9606"
            },
            "pageArgs": {
                "limit": 10,
                "offset": 0
            }
        }
        
        response = client.post("/graphql", json={
            "query": query,
            "variables": variables
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "annotations" in data["data"]
        assert len(data["data"]["annotations"]) == 1

    @patch('src.resolvers.annotation_resolver.get_genes')
    def test_genes_query(self, mock_get_genes, client, sample_gene):
        """Test genes query"""
        mock_get_genes.return_value = [Gene(**sample_gene)]
        
        query = """
        query GetGenes($filterArgs: GeneFilterArgs, $pageArgs: PageArgs) {
            genes(filterArgs: $filterArgs, pageArgs: $pageArgs) {
                gene
                geneSymbol
                geneName
                taxonAbbr
                terms {
                    id
                    label
                }
                termCount
            }
        }
        """
        
        variables = {
            "filterArgs": {
                "geneSymbol": "BRCA1"
            },
            "pageArgs": {
                "limit": 5
            }
        }
        
        response = client.post("/graphql", json={
            "query": query,
            "variables": variables
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "genes" in data["data"]
        genes = data["data"]["genes"]
        assert len(genes) == 1
        assert genes[0]["gene"] == "BRCA1"

    @patch('src.resolvers.annotation_stats_resolver.get_annotations_count')
    def test_annotations_count_query(self, mock_get_count, client):
        """Test annotations count query"""
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

    @patch('src.resolvers.gene_stats_resolver.get_genes_stats')
    def test_gene_stats_query(self, mock_get_stats, client):
        """Test gene stats query"""
        mock_stats = Mock()
        mock_stats.slim_term_frequency = Mock()
        mock_get_stats.return_value = mock_stats
        
        query = """
        query GetGeneStats($filterArgs: GeneFilterArgs) {
            geneStats(filterArgs: $filterArgs) {
                slimTermFrequency {
                    id
                    label
                    count
                }
            }
        }
        """
        
        response = client.post("/graphql", json={
            "query": query
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "geneStats" in data["data"]

    @patch('src.resolvers.autocomplete_resolver.get_autocomplete')
    def test_autocomplete_query(self, mock_autocomplete, client, sample_gene):
        """Test autocomplete query"""
        mock_autocomplete.return_value = [Gene(**sample_gene)]
        
        query = """
        query GetAutocomplete($autocompleteType: AutocompleteType!, $keyword: String!, $filterArgs: GeneFilterArgs) {
            autocomplete(autocompleteType: $autocompleteType, keyword: $keyword, filterArgs: $filterArgs) {
                gene
                geneSymbol
                geneName
            }
        }
        """
        
        variables = {
            "autocompleteType": "GENE",
            "keyword": "BRCA",
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
        assert "autocomplete" in data["data"]

    @patch('src.resolvers.autocomplete_resolver.get_slim_term_autocomplete_query_multi')
    def test_slim_terms_autocomplete_query(self, mock_slim_autocomplete, client):
        """Test slim terms autocomplete query"""
        sample_term = Term(
            id="GO:0003677",
            label="DNA binding",
            aspect="molecular_function",
            display_id="GO:0003677"
        )
        mock_slim_autocomplete.return_value = [sample_term]
        
        query = """
        query GetSlimTermsAutocomplete($keyword: String!, $filterArgs: AnnotationFilterArgs) {
            slimTermsAutocomplete(keyword: $keyword, filterArgs: $filterArgs) {
                id
                label
                aspect
                displayId
            }
        }
        """
        
        variables = {
            "keyword": "DNA",
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
        assert "slimTermsAutocomplete" in data["data"]

    @patch('src.resolvers.annotation_resolver.get_annotations_export')
    def test_annotations_export_query(self, mock_export, client):
        """Test annotations export query"""
        from src.models.annotation_model import AnnotationExport
        mock_export.return_value = AnnotationExport(
            data="gene\tterm\nevidence\nBRCA1\tGO:0003677"
        )
        
        query = """
        query GetAnnotationsExport($filterArgs: AnnotationFilterArgs, $pageArgs: PageArgs) {
            annotationsExport(filterArgs: $filterArgs, pageArgs: $pageArgs) {
                data
            }
        }
        """
        
        response = client.post("/graphql", json={
            "query": query
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "annotationsExport" in data["data"]

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

    def test_missing_required_argument_error(self, client):
        """Test error handling when required arguments are missing"""
        query = """
        query MissingRequiredArg {
            annotation {
                id
            }
        }
        """
        
        response = client.post("/graphql", json={"query": query})
        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_cors_headers(self, client):
        """Test CORS headers are properly set"""
        response = client.options("/graphql")
        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == "*"

    def test_version_context_handling(self, client):
        """Test that version context is properly handled"""
        query = """
        query TestVersionContext {
            annotationsCount {
                total
            }
        }
        """
        
        # Test with version header
        headers = {"x-api-version": "v2"}
        response = client.post("/graphql", json={"query": query}, headers=headers)
        assert response.status_code == 200
        
        # Test without version header (should use default)
        response = client.post("/graphql", json={"query": query})
        assert response.status_code == 200


class TestFunctionomeQueryUnit:
    """Unit tests for the FunctionomeQuery class"""
    
    @pytest.fixture
    def functionome_query(self):
        return FunctionomeQuery()
    
    @pytest.fixture
    def mock_context(self):
        context = Mock(spec=GraphQLContext)
        context.get_index.return_value = Mock()
        return context
    
    @pytest.fixture
    def mock_info(self, mock_context):
        info = Mock(spec=Info)
        info.context = mock_context
        return info

    @pytest.mark.asyncio
    @patch('src.resolvers.annotation_resolver.get_annotation')
    async def test_annotation_resolver_unit(self, mock_get_annotation, functionome_query, mock_info):
        """Unit test for annotation resolver"""
        expected_annotation = Mock(spec=Annotation)
        mock_get_annotation.return_value = expected_annotation
        
        result = await functionome_query.annotation(mock_info, "test_id")
        
        assert result == expected_annotation
        mock_get_annotation.assert_called_once()

    @pytest.mark.asyncio
    @patch('src.resolvers.annotation_resolver.get_annotations')
    async def test_annotations_resolver_unit(self, mock_get_annotations, functionome_query, mock_info):
        """Unit test for annotations resolver"""
        expected_annotations = [Mock(spec=Annotation), Mock(spec=Annotation)]
        mock_get_annotations.return_value = expected_annotations
        
        filter_args = Mock(spec=AnnotationFilterArgs)
        page_args = Mock(spec=PageArgs)
        
        result = await functionome_query.annotations(mock_info, filter_args, page_args)
        
        assert result == expected_annotations
        mock_get_annotations.assert_called_once()

    @pytest.mark.asyncio
    @patch('src.resolvers.annotation_resolver.get_genes')
    async def test_genes_resolver_unit(self, mock_get_genes, functionome_query, mock_info):
        """Unit test for genes resolver"""
        expected_genes = [Mock(spec=Gene), Mock(spec=Gene)]
        mock_get_genes.return_value = expected_genes
        
        filter_args = Mock(spec=GeneFilterArgs)
        page_args = Mock(spec=PageArgs)
        
        result = await functionome_query.genes(mock_info, filter_args, page_args)
        
        assert result == expected_genes
        mock_get_genes.assert_called_once()

    def test_get_annotations_index_helper(self, functionome_query, mock_context):
        """Test the _get_annotations_index helper method"""
        result = functionome_query._get_annotations_index(mock_context)
        mock_context.get_index.assert_called_once()

    def test_get_genes_index_helper(self, functionome_query, mock_context):
        """Test the _get_genes_index helper method"""
        result = functionome_query._get_genes_index(mock_context)
        mock_context.get_index.assert_called_once()


# Integration test helpers
class TestGraphQLIntegration:
    """Integration tests that test multiple components together"""
    
    @pytest.fixture
    def app(self):
        return create_app()
    
    @pytest.fixture
    def client(self, app):
        return TestClient(app)

    def test_complex_nested_query(self, client):
        """Test a complex nested query that exercises multiple resolvers"""
        query = """
        query ComplexQuery {
            annotations(pageArgs: {limit: 1}) {
                id
                gene
                geneSymbol
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
                    type
                    source
                }
            }
            annotationsCount {
                total
            }
        }
        """
        
        with patch('src.resolvers.annotation_resolver.get_annotations') as mock_annotations, \
             patch('src.resolvers.annotation_stats_resolver.get_annotations_count') as mock_count:
            
            # Mock the responses
            mock_annotations.return_value = []
            mock_count.return_value = ResultCount(total=0)
            
            response = client.post("/graphql", json={"query": query})
            assert response.status_code == 200
            data = response.json()
            assert "data" in data
            assert "annotations" in data["data"]
            assert "annotationsCount" in data["data"]

    def test_multiple_queries_in_single_request(self, client):
        """Test multiple queries in a single GraphQL request"""
        query = """
        query MultipleQueries {
            genesCount {
                total
            }
            annotationsCount {
                total
            }
        }
        """
        
        with patch('src.resolvers.gene_stats_resolver.get_genes_count') as mock_genes_count, \
             patch('src.resolvers.annotation_stats_resolver.get_annotations_count') as mock_annotations_count:
            
            mock_genes_count.return_value = ResultCount(total=10)
            mock_annotations_count.return_value = ResultCount(total=20)
            
            response = client.post("/graphql", json={"query": query})
            assert response.status_code == 200
            data = response.json()
            assert data["data"]["genesCount"]["total"] == 10
            assert data["data"]["annotationsCount"]["total"] == 20


if __name__ == "__main__":
    pytest.main([__file__])
