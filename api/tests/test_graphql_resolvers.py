import pytest
import os
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient

# Set up environment variables for testing
os.environ.setdefault("DEBUG", "False")
os.environ.setdefault("PANGO_ES_URL", "http://localhost:9200")
os.environ.setdefault("PANGO_ANNOTATIONS_INDEX", "test_annotations")
os.environ.setdefault("PANGO_GENES_INDEX", "test_genes")
os.environ.setdefault("HOST_URL", "localhost")
os.environ.setdefault("HOST_PORT", "8000")

from src.app import create_app
from src.models.base_model import ResultCount


class TestGraphQLResolvers:
    """Test GraphQL resolvers with mocked data"""
    
    @pytest.fixture
    def app(self):
        return create_app()
    
    @pytest.fixture
    def client(self, app):
        return TestClient(app)

    @patch('src.resolvers.annotation_stats_resolver.get_annotations_count')
    def test_annotations_count_simple(self, mock_get_count, client):
        """Test simple annotations count query"""
        mock_get_count.return_value = ResultCount(total=100)
        
        query = """
        query {
            annotationsCount {
                total
            }
        }
        """
        
        response = client.post("/graphql", json={"query": query})
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["annotationsCount"]["total"] == 100

    @patch('src.resolvers.gene_stats_resolver.get_genes_count')
    def test_genes_count_simple(self, mock_get_count, client):
        """Test simple genes count query"""
        mock_get_count.return_value = ResultCount(total=50)
        
        query = """
        query {
            genesCount {
                total
            }
        }
        """
        
        response = client.post("/graphql", json={"query": query})
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["genesCount"]["total"] == 50

    @patch('src.resolvers.annotation_resolver.get_annotation')
    def test_annotation_query_simple(self, mock_get_annotation, client):
        """Test single annotation query with mocked data"""
        from src.models.annotation_model import Annotation
        from src.models.term_model import Term
        
        # Create a simple annotation
        mock_annotation = Mock(spec=Annotation)
        mock_annotation.id = "test_1"
        mock_annotation.gene = "BRCA1"
        mock_annotation.gene_symbol = "BRCA1"
        mock_annotation.gene_name = "BRCA1 gene"
        mock_annotation.taxon_abbr = "HUMAN"
        mock_annotation.taxon_label = "Homo sapiens"
        
        mock_get_annotation.return_value = mock_annotation
        
        query = """
        query {
            annotation(id: "test_1") {
                id
                gene
                geneSymbol
                geneName
                taxonAbbr
                taxonLabel
            }
        }
        """
        
        response = client.post("/graphql", json={"query": query})
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        annotation = data["data"]["annotation"]
        assert annotation["id"] == "test_1"
        assert annotation["gene"] == "BRCA1"

    @patch('src.resolvers.annotation_resolver.get_annotations')
    def test_annotations_query_simple(self, mock_get_annotations, client):
        """Test annotations list query"""
        mock_get_annotations.return_value = []
        
        query = """
        query {
            annotations {
                id
                gene
            }
        }
        """
        
        response = client.post("/graphql", json={"query": query})
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["annotations"] == []

    @patch('src.resolvers.annotation_resolver.get_genes')
    def test_genes_query_simple(self, mock_get_genes, client):
        """Test genes list query"""
        mock_get_genes.return_value = []
        
        query = """
        query {
            genes {
                gene
                geneSymbol
            }
        }
        """
        
        response = client.post("/graphql", json={"query": query})
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["genes"] == []

    @patch('src.resolvers.annotation_resolver.get_annotations_export')
    def test_annotations_export_simple(self, mock_export, client):
        """Test annotations export query"""
        from src.models.annotation_model import AnnotationExport
        
        mock_export.return_value = AnnotationExport(data="gene\tterm\nBRCA1\tGO:0003677")
        
        query = """
        query {
            annotationsExport {
                data
            }
        }
        """
        
        response = client.post("/graphql", json={"query": query})
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "annotationsExport" in data["data"]
        assert "data" in data["data"]["annotationsExport"]

    @patch('src.resolvers.gene_stats_resolver.get_genes_stats')
    def test_gene_stats_simple(self, mock_get_stats, client):
        """Test gene stats query"""
        mock_stats = Mock()
        mock_stats.slim_term_frequency = Mock()
        mock_get_stats.return_value = mock_stats
        
        query = """
        query {
            geneStats {
                slimTermFrequency {
                    id
                    label
                    count
                }
            }
        }
        """
        
        response = client.post("/graphql", json={"query": query})
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "geneStats" in data["data"]

    @patch('src.resolvers.autocomplete_resolver.get_autocomplete')
    def test_autocomplete_simple(self, mock_autocomplete, client):
        """Test autocomplete query"""
        mock_autocomplete.return_value = []
        
        query = """
        query {
            autocomplete(autocompleteType: GENE, keyword: "BRCA") {
                gene
                geneSymbol
            }
        }
        """
        
        response = client.post("/graphql", json={"query": query})
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["autocomplete"] == []

    @patch('src.resolvers.autocomplete_resolver.get_slim_term_autocomplete_query_multi')
    def test_slim_terms_autocomplete_simple(self, mock_slim_autocomplete, client):
        """Test slim terms autocomplete query"""
        mock_slim_autocomplete.return_value = []
        
        query = """
        query {
            slimTermsAutocomplete(keyword: "DNA") {
                id
                label
            }
        }
        """
        
        response = client.post("/graphql", json={"query": query})
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["slimTermsAutocomplete"] == []


if __name__ == "__main__":
    pytest.main([__file__])
