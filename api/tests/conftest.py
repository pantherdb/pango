import sys
import os
import pytest
from unittest.mock import Mock

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

@pytest.fixture
def mock_elasticsearch():
    """Mock Elasticsearch client for testing"""
    return Mock()

@pytest.fixture
def mock_settings():
    """Mock settings for testing"""
    settings = Mock()
    settings.PANGO_ANNOTATIONS_INDEX = "test_annotations"
    settings.PANGO_GENES_INDEX = "test_genes"
    settings.DEFAULT_API_VERSION = "v1"
    return settings
