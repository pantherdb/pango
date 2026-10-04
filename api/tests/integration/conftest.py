"""A real Elasticsearch, loaded the way the loader loads production.

The loader's index settings and mappings (loader/data/es_settings) and its fixture output
(loader/test_data/output/pango-test) go into ``pango-test-pytest-*`` indexes, and the API is queried
with ``X-API-Version: pango-test``. Point PANGO_TEST_ES_URL at any Elasticsearch 8.x; these tests
are skipped when it can't be reached.
"""
import pytest
from elasticsearch import Elasticsearch, helpers
from fastapi.testclient import TestClient

from src.app import create_app
from src.config.es import es
from src.config.settings import ApiVersion, settings
from src.graphql.graphql_context import GraphQLContext
from tests.helpers import LOADER_ES_SETTINGS_DIR, GraphQLClient, read_json

VERSION = ApiVersion.V_TEST


@pytest.fixture(scope="session")
def es_admin():
    """Synchronous client for setup and teardown."""
    client = Elasticsearch(settings.PANGO_ES_URL, request_timeout=10, max_retries=0)
    try:
        client.info()
    except Exception as exc:
        client.close()
        pytest.skip(f"Elasticsearch unreachable at {settings.PANGO_ES_URL} ({type(exc).__name__}); "
                    "set PANGO_TEST_ES_URL, see tests/README.md")
    yield client
    client.close()


@pytest.fixture(scope="session")
def indexes(es_admin, loader_annotations, loader_genes):
    """Create and fill the pango-test indexes; yields {"annotations": name, "genes": name}."""
    context = GraphQLContext(version=VERSION)
    names = {
        "annotations": context.get_index(settings.PANGO_ANNOTATIONS_INDEX),
        "genes": context.get_index(settings.PANGO_GENES_INDEX),
    }
    documents = {"annotations": loader_annotations, "genes": loader_genes}
    index_settings = read_json(LOADER_ES_SETTINGS_DIR / "settings.json")
    for kind, index in names.items():
        es_admin.options(ignore_status=404).indices.delete(index=index)
        es_admin.indices.create(index=index, settings=index_settings,
                                mappings=read_json(LOADER_ES_SETTINGS_DIR / f"{kind}_mappings.json"))
        # like loader/src/index_es.py: raw documents, generated ids
        helpers.bulk(es_admin, documents[kind], index=index, refresh=True)
    yield names
    for index in names.values():
        es_admin.options(ignore_status=404).indices.delete(index=index)


@pytest.fixture(scope="session")
def live(indexes):
    """GraphQL client for the app, routed to the pango-test indexes.

    One TestClient (one event loop) for the whole session: the shared AsyncElasticsearch client
    binds its HTTP session to the loop of its first request.
    """
    with TestClient(create_app()) as http:
        yield GraphQLClient(http, headers={"X-API-Version": VERSION.value})
        http.portal.call(es.close)
