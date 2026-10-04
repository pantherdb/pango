"""API versioning and settings: ApiVersion, Settings, GraphQLContext and VersionManager."""
import pytest
from starlette.requests import Request

from src.config.settings import ApiVersion, Settings, settings
from src.graphql.graphql_context import GraphQLContext
from src.middleware.version_manager import VersionManager


def make_request(headers=None, query_string=""):
    return Request({
        "type": "http",
        "method": "POST",
        "path": "/graphql",
        "headers": [(name.lower().encode(), value.encode()) for name, value in (headers or {}).items()],
        "query_string": query_string.encode(),
    })


class TestApiVersion:

    def test_known_versions(self):
        assert [v.value for v in ApiVersion] == ["pango-test", "pango-1", "pango-2", "latest"]

    def test_values_parse_to_members(self):
        assert ApiVersion("pango-2") is ApiVersion.V2

    def test_members_compare_equal_to_their_value(self):
        assert ApiVersion.V2 == "pango-2"


class TestSettings:

    def test_index_names_come_from_the_environment(self):
        assert settings.PANGO_ANNOTATIONS_INDEX == "pytest-annotations"
        assert settings.PANGO_GENES_INDEX == "pytest-genes"

    def test_default_api_version_is_latest(self):
        assert settings.DEFAULT_API_VERSION is ApiVersion.LATEST

    def test_environment_is_read_on_instantiation(self, monkeypatch):
        monkeypatch.setenv("PANGO_ES_URL", "http://es.example.org:9200")
        monkeypatch.setenv("HOST_PORT", "8123")
        fresh = Settings()
        assert fresh.PANGO_ES_URL == "http://es.example.org:9200"
        assert fresh.HOST_PORT == 8123

    def test_base_url(self):
        configured = Settings(HOST_HTTP="https://", HOST_URL="pango.example.org", HOST_PORT=8443)
        assert configured.BASE_URL == "https://pango.example.org:8443"

    @pytest.mark.parametrize("version, expected", [
        (None, "pango-1-genes"),
        (ApiVersion.LATEST, "pango-1-genes"),
        (ApiVersion.V1, "pango-1-genes"),
        (ApiVersion.V2, "pango-2-genes"),
        (ApiVersion.V_TEST, "pango-test-genes"),
    ])
    def test_get_versioned_index(self, version, expected):
        assert settings.get_versioned_index("genes", version) == expected


class TestGraphQLContext:

    @pytest.mark.parametrize("version, prefix", [
        (ApiVersion.V1, "pango-1"),
        (ApiVersion.V2, "pango-2"),
        (ApiVersion.V_TEST, "pango-test"),
        # Clients that send no version get pango-1, although the UI defaults to pango-2 (it always
        # sends X-API-Version). Update deliberately when "latest" moves.
        (ApiVersion.LATEST, "pango-1"),
        (None, "pango-1"),
    ])
    def test_get_index_prefixes_the_version(self, version, prefix):
        assert GraphQLContext(version=version).get_index("pango-genes") == f"{prefix}-pango-genes"

    def test_defaults_to_the_configured_version(self):
        assert GraphQLContext().version is settings.DEFAULT_API_VERSION


class TestVersionManager:

    @pytest.mark.parametrize("version", list(ApiVersion), ids=lambda v: v.value)
    def test_reads_the_header(self, version):
        request = make_request({"X-API-Version": version.value})
        assert VersionManager.get_version_from_request(request) is version

    @pytest.mark.parametrize("version", list(ApiVersion), ids=lambda v: v.value)
    def test_reads_the_version_query_parameter(self, version):
        request = make_request(query_string=f"version={version.value}")
        assert VersionManager.get_version_from_request(request) is version

    def test_header_wins_over_query_parameter(self):
        request = make_request({"X-API-Version": "pango-2"}, "version=pango-1")
        assert VersionManager.get_version_from_request(request) is ApiVersion.V2

    def test_empty_header_falls_back_to_query_parameter(self):
        request = make_request({"X-API-Version": ""}, "version=pango-2")
        assert VersionManager.get_version_from_request(request) is ApiVersion.V2

    @pytest.mark.parametrize("value", ["v2", "2", "PANGO-2", "pango-3", "Latest"])
    def test_unknown_versions_are_ignored(self, value):
        assert VersionManager.get_version_from_request(make_request({"X-API-Version": value})) is None

    def test_unknown_header_does_not_fall_back_to_query_parameter(self):
        # The first non-empty source decides, even when its value is invalid.
        request = make_request({"X-API-Version": "v2"}, "version=pango-2")
        assert VersionManager.get_version_from_request(request) is None

    def test_no_version_supplied(self):
        assert VersionManager.get_version_from_request(make_request()) is None
