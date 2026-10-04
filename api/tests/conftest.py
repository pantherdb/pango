"""Shared fixtures for the PAN-GO API tests.

``src.config.settings`` reads the environment at import time (``HOST_PORT`` is mandatory) and
``src.config.es`` builds the shared Elasticsearch client from it, so the environment is pinned here,
before anything imports ``src``.
"""
import os

# Dedicated index base names: no test can read, create or delete a real index.
os.environ["PANGO_ANNOTATIONS_INDEX"] = "pytest-annotations"
os.environ["PANGO_GENES_INDEX"] = "pytest-genes"
# Only tests/integration talks to Elasticsearch. PANGO_TEST_ES_URL (not PANGO_ES_URL) selects the
# cluster so a shell configured for a shared cluster is never used by accident.
os.environ["PANGO_ES_URL"] = os.environ.get("PANGO_TEST_ES_URL", "http://localhost:9200")
os.environ.setdefault("HOST_URL", "localhost")
os.environ.setdefault("HOST_PORT", "5000")

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from src.app import create_app
from src.resolvers import (
    annotation_resolver,
    annotation_stats_resolver,
    autocomplete_resolver,
    gene_stats_resolver,
)
from tests.helpers import LOADER_FIXTURES_DIR, GraphQLClient, read_json

# Each resolver module did ``from src.config.es import es`` and so holds its own reference.
RESOLVER_MODULES = (annotation_resolver, annotation_stats_resolver, gene_stats_resolver, autocomplete_resolver)


@pytest.fixture(autouse=True)
def _no_real_elasticsearch(request, monkeypatch):
    """Make an un-mocked ES call fail at once; the real client retries a dead node for minutes."""
    if request.node.get_closest_marker("integration"):
        return
    guard = MagicMock(name="es")
    for method in ("get", "search", "count"):
        error = AssertionError(f"unexpected es.{method}() call; request the es_mock fixture")
        setattr(guard, method, AsyncMock(side_effect=error))
    for module in RESOLVER_MODULES:
        monkeypatch.setattr(module, "es", guard)


@pytest.fixture
def es_mock(_no_real_elasticsearch, monkeypatch):
    """The shared AsyncElasticsearch client, replaced in every resolver module.

    Set ``es_mock.search.return_value`` (or ``side_effect`` for several calls) and assert on
    ``es_mock.search.await_args.kwargs`` to check the exact request sent to Elasticsearch.
    """
    mock = MagicMock(name="es")
    mock.get = AsyncMock(name="es.get")
    mock.search = AsyncMock(name="es.search")
    mock.count = AsyncMock(name="es.count")
    for module in RESOLVER_MODULES:
        monkeypatch.setattr(module, "es", mock)
    return mock


@pytest.fixture
def client():
    return TestClient(create_app())


@pytest.fixture
def gql(client):
    return GraphQLClient(client)


# Real loader output, shared by the contract and integration tests. Treat as read-only.

@pytest.fixture(scope="session")
def loader_annotations():
    return read_json(LOADER_FIXTURES_DIR / "human_iba_annotations_clean.json")


@pytest.fixture(scope="session")
def loader_genes():
    return read_json(LOADER_FIXTURES_DIR / "human_iba_genes_clean.json")
