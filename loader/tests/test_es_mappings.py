"""The ES mappings in data/es_settings are maintained by hand, apart from the code
that builds the documents. Check that every field a mapping declares appears in
the pipeline output, so a rename on either side can't silently leave the field
to dynamic mapping (e.g. `terms` losing its nested type).
"""
import json
import os
import pytest

ES_SETTINGS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'es_settings')


def mapped_fields(properties, prefix=''):
    """Dotted paths of every field declared in a mapping."""
    fields = set()
    for name, spec in properties.items():
        path = prefix + name
        fields.add(path)
        fields |= mapped_fields(spec.get('properties', {}), path + '.')
    return fields


def document_fields(doc, prefix=''):
    """Dotted paths of every field in a document, looking inside objects and lists of objects."""
    fields = set()
    for name, value in doc.items():
        path = prefix + name
        fields.add(path)
        for item in value if isinstance(value, list) else [value]:
            if isinstance(item, dict):
                fields |= document_fields(item, path + '.')
    return fields


@pytest.mark.parametrize('mapping_file, output_fixture, never_populated', [
    ('annotations_mappings.json', 'clean_annotations_data', set()),
    # A completion field the loader never fills in (and the API never queries).
    ('genes_mappings.json', 'clean_genes_data', {'name_suggest'}),
])
def test_mapped_fields_are_produced_by_pipeline(request, mapping_file, output_fixture, never_populated):
    with open(os.path.join(ES_SETTINGS_DIR, mapping_file), encoding='utf-8') as f:
        mapping = json.load(f)
    docs = request.getfixturevalue(output_fixture)

    produced = set().union(*(document_fields(doc) for doc in docs))

    assert mapped_fields(mapping['properties']) - produced == never_populated
