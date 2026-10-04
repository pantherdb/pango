"""The HTTP surface: transport, GraphQL errors, CORS and API-version routing."""
import pytest
from elasticsearch import ConnectionError as ESConnectionError

from tests.factories import (
    annotation_doc,
    count_response,
    filtered_search_response,
    get_response,
    hit,
    search_response,
    slim_label_frequency,
    slim_term_frequency,
    term_frequency,
)

COUNT = "{ annotationsCount { total } }"


class TestTransport:

    def test_post_json(self, gql, es_mock):
        es_mock.count.return_value = count_response(22)
        assert gql.data(COUNT) == {"annotationsCount": {"total": 22}}

    def test_get_with_a_query_parameter_executes(self, client, es_mock):
        es_mock.count.return_value = count_response(22)
        response = client.get("/graphql", params={"query": COUNT})
        assert response.status_code == 200
        assert response.json() == {"data": {"annotationsCount": {"total": 22}}}

    def test_browsers_get_graphiql(self, client):
        response = client.get("/graphql", headers={"Accept": "text/html"})
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/html")
        assert "GraphiQL" in response.text

    def test_malformed_json_is_rejected(self, client):
        response = client.post("/graphql", content=b"{not json", headers={"Content-Type": "application/json"})
        assert response.status_code == 400

    def test_missing_query_is_rejected(self, client):
        assert client.post("/graphql", json={}).status_code == 400

    def test_only_graphql_is_served(self, client):
        assert client.get("/").status_code == 404


class TestGraphQLErrors:
    """GraphQL errors come back as HTTP 200 with an ``errors`` list."""

    def test_unknown_field(self, gql):
        body = gql.post("{ nope }")
        assert body["data"] is None
        assert body["errors"][0]["message"] == "Cannot query field 'nope' on type 'FunctionomeQuery'."

    def test_syntax_error(self, gql):
        (error,) = gql.errors("{ annotationsCount { total ")
        assert error["message"].startswith("Syntax Error")

    def test_missing_required_argument(self, gql):
        (error,) = gql.errors("{ annotation { id } }")
        assert "argument 'id'" in error["message"]

    def test_enum_values_are_lowercase(self, gql):
        (error,) = gql.errors('{ autocomplete(autocompleteType: GENE, keyword: "snx") { gene } }')
        assert "Did you mean the enum value 'gene'?" in error["message"]

    def test_variables_are_type_checked(self, gql):
        (error,) = gql.errors("query($p: PageArgs) { annotations(pageArgs: $p) { id } }", {"p": {"page": "first"}})
        assert "Int cannot represent" in error["message"]

    def test_mutations_are_not_supported(self, gql):
        (error,) = gql.errors("mutation { annotationsCount { total } }")
        assert error["message"] == "Schema is not configured to execute mutation operation."

    def test_elasticsearch_failure_is_reported_on_its_field(self, gql, es_mock):
        es_mock.count.side_effect = ESConnectionError("connection refused")
        body = gql.post(COUNT)
        assert body["data"] is None
        assert body["errors"][0]["path"] == ["annotationsCount"]

    def test_one_failing_field_nulls_the_whole_response(self, gql, es_mock):
        def count(index, query):
            if index.endswith("annotations"):
                raise ESConnectionError("connection refused")
            return count_response(5)

        es_mock.count.side_effect = count
        body = gql.post("{ genesCount { total } annotationsCount { total } }")
        # every query field is non-null, so one failure propagates to data
        assert body["data"] is None
        assert [e["path"] for e in body["errors"]] == [["annotationsCount"]]


class TestCORS:

    def test_preflight_allows_any_origin_and_the_version_header(self, client):
        response = client.options("/graphql", headers={
            "Origin": "https://pango.example.org",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,x-api-version",
        })
        assert response.status_code == 200
        # allow_credentials=True makes Starlette echo the origin rather than "*"
        assert response.headers["access-control-allow-origin"] == "https://pango.example.org"
        assert response.headers["access-control-allow-headers"] == "content-type,x-api-version"
        assert "POST" in response.headers["access-control-allow-methods"]

    def test_requests_from_any_origin_are_allowed(self, client, es_mock):
        es_mock.count.return_value = count_response(1)
        response = client.post("/graphql", json={"query": COUNT}, headers={"Origin": "https://pango.example.org"})
        assert response.headers["access-control-allow-origin"] == "*"

    def test_options_without_cors_headers_is_not_a_preflight(self, client):
        assert client.options("/graphql").status_code == 405


# (document, ES method, mocked response(s), index kinds queried in order)
EVERY_FIELD = {
    "annotation": ('{ annotation(id: "a1") { id } }', "get", get_response(annotation_doc(), id="a1"), ["annotations"]),
    "annotations": ("{ annotations { id } }", "search", filtered_search_response(), ["annotations"]),
    "annotationsCount": ("{ annotationsCount { total } }", "count", count_response(0), ["annotations"]),
    "annotationsExport": ("{ annotationsExport { data } }", "search", filtered_search_response(), ["annotations"]),
    "genes": ("{ genes { gene } }", "search", search_response(), ["genes"]),
    "genesCount": ("{ genesCount { total } }", "count", count_response(0), ["genes"]),
    "geneStats": ("{ geneStats { slimTermFrequency { buckets { key } } } }", "search",
                  search_response(aggregations=slim_term_frequency()), ["genes"]),
    "termStats": ('{ termStats(filterArgs: {geneIds: ["G"]}) { termFrequency { buckets { key } } } }', "search",
                  [search_response([hit({"gene": "G"})]), search_response(aggregations=term_frequency())],
                  ["genes", "annotations"]),
    "autocomplete": ('{ autocomplete(autocompleteType: gene, keyword: "snx") { gene } }', "search",
                     filtered_search_response(), ["genes"]),
    # queries the genes index although it takes AnnotationFilterArgs
    "slimTermsAutocomplete": ('{ slimTermsAutocomplete(keyword: "auto") { id } }', "search",
                              search_response(aggregations=slim_label_frequency()), ["genes"]),
}


class TestVersionRouting:

    @pytest.mark.parametrize("headers, params, prefix", [
        ({}, {}, "pango-1"),
        ({"X-API-Version": "pango-2"}, {}, "pango-2"),
        ({"X-API-Version": "pango-1"}, {}, "pango-1"),
        ({"X-API-Version": "pango-test"}, {}, "pango-test"),
        ({"X-API-Version": "latest"}, {}, "pango-1"),
        ({"x-api-version": "pango-2"}, {}, "pango-2"),
        ({}, {"version": "pango-2"}, "pango-2"),
        ({"X-API-Version": "pango-2"}, {"version": "pango-1"}, "pango-2"),
        ({"X-API-Version": "v2"}, {}, "pango-1"),
    ], ids=["default", "header", "header-pango-1", "header-test", "header-latest", "lowercase-header",
            "query-param", "header-beats-param", "unknown-version"])
    def test_request_selects_the_index_version(self, client, es_mock, headers, params, prefix):
        es_mock.count.return_value = count_response(0)
        response = client.post("/graphql", params=params, json={"query": COUNT}, headers=headers)
        assert response.status_code == 200
        assert es_mock.count.await_args.kwargs["index"] == f"{prefix}-pytest-annotations"

    @pytest.mark.parametrize("field", EVERY_FIELD)
    def test_every_field_uses_the_requested_version(self, gql, es_mock, field):
        document, method, response, kinds = EVERY_FIELD[field]
        mocked = getattr(es_mock, method)
        if isinstance(response, list):
            mocked.side_effect = response
        else:
            mocked.return_value = response
        gql.data(document, headers={"X-API-Version": "pango-2"})
        assert [call.kwargs["index"] for call in mocked.await_args_list] == [f"pango-2-pytest-{k}" for k in kinds]

    def test_version_does_not_leak_between_requests(self, gql, es_mock):
        es_mock.count.return_value = count_response(0)
        gql.data(COUNT, headers={"X-API-Version": "pango-2"})
        gql.data(COUNT)
        assert [c.kwargs["index"] for c in es_mock.count.await_args_list] == \
            ["pango-2-pytest-annotations", "pango-1-pytest-annotations"]
