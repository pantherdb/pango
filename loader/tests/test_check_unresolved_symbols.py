import json
import pytest

from src.check_unresolved_symbols import process_gene_entry, process_file


# --- process_gene_entry ---

def test_process_gene_entry_named():
    entry = {"gene": "UniProtKB:Q8TD07", "gene_symbol": "RAET1E"}
    result = process_gene_entry(entry)
    assert result["named_gene"] is True  # Q8TD07 != RAET1E


def test_process_gene_entry_unnamed():
    entry = {"gene": "UniProtKB:RAET1E", "gene_symbol": "RAET1E"}
    result = process_gene_entry(entry)
    assert result["named_gene"] is False  # RAET1E == RAET1E


def test_process_gene_entry_no_prefix():
    entry = {"gene": "RAET1E", "gene_symbol": "RAET1E"}
    result = process_gene_entry(entry)
    assert result["named_gene"] is False


def test_process_gene_entry_non_uniprot_prefix():
    entry = {"gene": "MGI:MGI:12345", "gene_symbol": "Abc1"}
    result = process_gene_entry(entry)
    # "MGI:MGI:12345" without UniProtKB: stays "MGI:MGI:12345", != "Abc1"
    assert result["named_gene"] is True


def test_process_gene_entry_empty_fields():
    entry = {"gene": "", "gene_symbol": ""}
    result = process_gene_entry(entry)
    assert result["named_gene"] is False


def test_process_gene_entry_missing_fields():
    entry = {}
    result = process_gene_entry(entry)
    assert result["named_gene"] is False  # "" != "" is False


def test_process_gene_entry_mutates_dict():
    entry = {"gene": "UniProtKB:Q1", "gene_symbol": "SYM"}
    original_id = id(entry)
    result = process_gene_entry(entry)
    assert id(result) == original_id  # same dict object returned


# --- process_file ---

def test_process_file(tmp_path):
    data = [
        {"gene": "UniProtKB:Q8TD07", "gene_symbol": "RAET1E"},
        {"gene": "UniProtKB:P56747", "gene_symbol": "CLDN6"},
        {"gene": "UniProtKB:CLDN6", "gene_symbol": "CLDN6"},
    ]
    inp = str(tmp_path / 'input.json')
    out = str(tmp_path / 'output.json')
    with open(inp, 'w') as f:
        json.dump(data, f)

    process_file(inp, out)

    with open(out) as f:
        result = json.load(f)

    assert len(result) == 3
    assert result[0]["named_gene"] is True   # Q8TD07 != RAET1E
    assert result[1]["named_gene"] is True   # P56747 != CLDN6
    assert result[2]["named_gene"] is False  # CLDN6 == CLDN6


def test_process_file_empty_list(tmp_path):
    inp = str(tmp_path / 'input.json')
    out = str(tmp_path / 'output.json')
    with open(inp, 'w') as f:
        json.dump([], f)

    process_file(inp, out)

    with open(out) as f:
        assert json.load(f) == []


def test_process_file_preserves_other_fields(tmp_path):
    data = [{"gene": "UniProtKB:Q1", "gene_symbol": "SYM", "extra": "keep"}]
    inp = str(tmp_path / 'input.json')
    out = str(tmp_path / 'output.json')
    with open(inp, 'w') as f:
        json.dump(data, f)

    process_file(inp, out)

    with open(out) as f:
        result = json.load(f)
    assert result[0]["extra"] == "keep"
    assert "named_gene" in result[0]
