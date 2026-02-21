import json
import gzip
import pandas as pd
import pytest

from src.utils import write_to_json, load_json, get_pd_row, get_pd_row_key


# --- Fixtures ---

@pytest.fixture
def sample_data():
    return {
        "test_key": "test_value",
        "number": 42,
        "list": [1, 2, 3],
        "nested": {"inner": "value"}
    }


@pytest.fixture
def sample_df():
    df = pd.DataFrame({
        'id': ['A', 'B', 'C'],
        'name': ['Alice', 'Bob', 'Charlie'],
        'age': [25, 30, None],
        'city': ['New York', 'London', 'Tokyo']
    })
    return df.set_index('id')


# --- write_to_json ---

def test_write_to_json_regular(tmp_path, sample_data):
    fp = str(tmp_path / 'out.json')
    write_to_json(sample_data, fp)
    assert load_json(fp) == sample_data


def test_write_to_json_with_indent(tmp_path, sample_data):
    fp = str(tmp_path / 'out.json')
    write_to_json(sample_data, fp, indent=2)
    content = open(fp, encoding='utf-8').read()
    assert '\n' in content
    assert '  ' in content
    assert json.loads(content) == sample_data


def test_write_to_json_compressed(tmp_path, sample_data):
    fp = str(tmp_path / 'out.json.gz')
    write_to_json(sample_data, fp, zip=True)
    with gzip.open(fp, 'rt', encoding='utf-8') as f:
        assert json.load(f) == sample_data


def test_write_to_json_unicode(tmp_path):
    data = {"text": "Hello 世界 🌍", "accents": "café naïve", "symbols": "α β γ"}
    fp = str(tmp_path / 'out.json')
    write_to_json(data, fp)
    assert load_json(fp) == data


def test_write_to_json_invalid_path():
    with pytest.raises((OSError, IOError, FileNotFoundError)):
        write_to_json({'test': 'data'}, '/invalid/path/that/does/not/exist/file.json')


# --- load_json ---

def test_load_json(tmp_path, sample_data):
    fp = str(tmp_path / 'in.json')
    with open(fp, 'w', encoding='utf-8') as f:
        json.dump(sample_data, f)
    assert load_json(fp) == sample_data


def test_load_json_file_not_found():
    with pytest.raises(FileNotFoundError):
        load_json('/path/to/nonexistent/file.json')


def test_load_json_invalid_json(tmp_path):
    fp = str(tmp_path / 'bad.json')
    with open(fp, 'w') as f:
        f.write('{ invalid json }')
    with pytest.raises(json.JSONDecodeError):
        load_json(fp)


# --- get_pd_row ---

def test_get_pd_row(sample_df):
    result = get_pd_row(sample_df, 'A')
    assert isinstance(result, dict)
    assert result['name'] == 'Alice'
    assert result['city'] == 'New York'
    assert float(result['age']) == 25.0


def test_get_pd_row_with_nan(sample_df):
    result = get_pd_row(sample_df, 'C')
    assert result['name'] == 'Charlie'
    assert result['city'] == 'Tokyo'
    assert 'age' not in result


def test_get_pd_row_nonexistent(sample_df):
    with pytest.raises(KeyError):
        get_pd_row(sample_df, 'Z')


# --- get_pd_row_key ---

def test_get_pd_row_key(sample_df):
    result = get_pd_row_key(sample_df, 'B')
    assert isinstance(result, dict)
    assert result['name'] == 'Bob'
    assert result['city'] == 'London'
    assert float(result['age']) == 30.0


def test_get_pd_row_key_nonexistent(sample_df):
    assert get_pd_row_key(sample_df, 'Z') is None


def test_get_pd_row_key_with_nan(sample_df):
    result = get_pd_row_key(sample_df, 'C')
    assert result['name'] == 'Charlie'
    assert 'age' not in result


def test_pandas_with_complex_data():
    df = pd.DataFrame({
        'id': ['X1', 'X2', 'X3'],
        'data': [{'nested': 'value1'}, {'nested': 'value2'}, None],
        'numbers': [1.5, None, 3.7],
        'lists': [[1, 2, 3], [], [4, 5]]
    }).set_index('id')

    result = get_pd_row_key(df, 'X1')
    assert result['data'] == {'nested': 'value1'}
    assert float(result['numbers']) == 1.5
    assert result['lists'] == [1, 2, 3]

    result = get_pd_row_key(df, 'X3')
    assert result['lists'] == [4, 5]
    assert float(result['numbers']) == 3.7
    assert 'data' not in result


# --- Integration with test data ---

def test_integration_round_trip(tmp_path, articles_fp):
    data = load_json(articles_fp)
    assert isinstance(data, list)
    assert len(data) > 0
    assert 'pmid' in data[0]
    assert 'title' in data[0]

    fp = str(tmp_path / 'round_trip.json')
    write_to_json(data[:5], fp, indent=2)
    assert load_json(fp) == data[:5]
