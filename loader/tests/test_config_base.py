import argparse
import pytest

from src.config.base import file_path, dir_path, TableAggType


# --- file_path ---

def test_file_path_valid(tmp_path):
    fp = tmp_path / 'test.json'
    fp.write_text('{}')
    assert file_path(str(fp)) == str(fp)


def test_file_path_invalid():
    with pytest.raises(argparse.ArgumentTypeError):
        file_path('/nonexistent/file.json')


# --- dir_path ---

def test_dir_path_valid(tmp_path):
    assert dir_path(str(tmp_path)) == str(tmp_path)


def test_dir_path_invalid():
    with pytest.raises(argparse.ArgumentTypeError):
        dir_path('/nonexistent/directory')


# --- TableAggType ---

def test_table_agg_type_values():
    assert TableAggType.ANNOTATIONS.value == 'annotations'
    assert TableAggType.GENES.value == 'genes'


def test_table_agg_type_members():
    members = [m.value for m in TableAggType]
    assert set(members) == {'annotations', 'genes'}
