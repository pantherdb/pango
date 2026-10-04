#!/bin/bash
# Run the loader test suite with pytest.
#
#   tests/run_tests.sh                  # all tests
#   tests/run_tests.sh articles -x      # one area; extra arguments go to pytest
#   tests/run_tests.sh help

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")"

# Prefer the Poetry in-project virtualenv; override with PYTHON=/path/to/python.
if [ -z "$PYTHON" ]; then
    for candidate in .venv/Scripts/python.exe .venv/bin/python python; do
        if "$candidate" -c 'import pytest, pandas' 2>/dev/null; then
            PYTHON=$candidate
            break
        fi
    done
fi
if [ -z "$PYTHON" ]; then
    echo "No Python with the loader's dependencies found: run 'poetry install' or set PYTHON=..." >&2
    exit 1
fi

usage() {
    cat <<EOF
Usage: $0 [area] [pytest args...]

Areas:
  all          every test (default)
  utils        test_utils.py test_config_base.py
  articles     test_get_articles.py test_clean_articles.py
  annotations  test_clean_annotations.py
  genes        test_generate_gene_annotations.py
  pipeline     test_pipeline.py test_es_mappings.py
  es           test_create_index.py test_index_es.py
  tools        test_extract_sample_data.py test_check_unresolved_symbols.py test_get_latest_versions.py
EOF
}

area=all
if [ $# -gt 0 ] && [[ "$1" != -* ]]; then
    area=$1
    shift
fi

case "$area" in
    all)         files=() ;;
    utils)       files=(test_utils.py test_config_base.py) ;;
    articles)    files=(test_get_articles.py test_clean_articles.py) ;;
    annotations) files=(test_clean_annotations.py) ;;
    genes)       files=(test_generate_gene_annotations.py) ;;
    pipeline)    files=(test_pipeline.py test_es_mappings.py) ;;
    es)          files=(test_create_index.py test_index_es.py) ;;
    tools)       files=(test_extract_sample_data.py test_check_unresolved_symbols.py test_get_latest_versions.py) ;;
    help|-h|--help) usage; exit 0 ;;
    *)           echo "Unknown area: $area" >&2; usage >&2; exit 1 ;;
esac

exec "$PYTHON" -m pytest "${files[@]/#/tests/}" "$@"
