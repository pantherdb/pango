"""Shared test helpers: repository paths, loader fixture data and a GraphQL client."""
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

API_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = API_DIR.parent
LOADER_DIR = REPO_DIR / "loader"
# Real loader output (what index_es.py bulk-loads) and the index config it is loaded with.
LOADER_FIXTURES_DIR = LOADER_DIR / "test_data" / "output" / "pango-test"
LOADER_ES_SETTINGS_DIR = LOADER_DIR / "data" / "es_settings"
FRONTEND_SRC_DIR = REPO_DIR / "site-react" / "src"

# Selections of every output field (evidence genes skip the Gene fields they can't resolve).
TERM_SELECTION = "id label displayId aspect isGoslim count evidenceType parentIds"
GENE_SCALARS = ("gene geneSymbol geneName namedGene longId pantherFamily taxonAbbr taxonLabel taxonId "
                "coordinatesChrNum coordinatesStart coordinatesEnd coordinatesStrand")
EVERY_ANNOTATION_FIELD = f"""
    id {GENE_SCALARS} termType evidenceType groups evidenceCount
    term {{ {TERM_SELECTION} }}
    slimTerms {{ {TERM_SELECTION} }}
    evidence {{ withGeneId {{ {GENE_SCALARS} }} references {{ pmid title authors date }} }}
"""
EVERY_GENE_FIELD = f"{GENE_SCALARS} termCount terms {{ {TERM_SELECTION} }} slimTerms {{ {TERM_SELECTION} }}"


def same_clauses(actual: list, expected: list) -> bool:
    """Compare ``bool.filter`` clause lists, which are ANDed and so order-independent."""
    canonical = lambda clauses: sorted(json.dumps(c, sort_keys=True) for c in clauses)
    return canonical(actual) == canonical(expected)


def read_json(path: Path):
    """Load a JSON file from a sibling project, skipping the test when it isn't checked out."""
    if not path.exists():
        pytest.skip(f"{path} not found")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


class GraphQLClient:
    """Posts GraphQL documents to the app the way the frontend does."""

    def __init__(self, http: TestClient, headers: dict = None):
        self.http = http
        self.headers = headers or {}

    def post(self, query: str, variables: dict = None, headers: dict = None) -> dict:
        response = self.http.post(
            "/graphql",
            json={"query": query, "variables": variables or {}},
            headers={**self.headers, **(headers or {})},
        )
        assert response.status_code == 200, response.text
        return response.json()

    def data(self, query: str, variables: dict = None, headers: dict = None) -> dict:
        """Execute and return ``data``, failing the test on any GraphQL error."""
        body = self.post(query, variables, headers)
        assert "errors" not in body, body["errors"]
        return body["data"]

    def errors(self, query: str, variables: dict = None, headers: dict = None) -> list:
        """Execute and return ``errors``, failing the test if the request succeeded."""
        body = self.post(query, variables, headers)
        assert body.get("errors"), f"expected GraphQL errors, got {body}"
        return body["errors"]
