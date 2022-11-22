import json
from pathlib import Path
from src.config.base import TableAggType
from src.config.settings import settings
from src.config.es import es


def get_index_name(tsv_type: TableAggType):
    index_map = {
        'annotation': settings.PANTHER_ANNOTATIONS_INDEX
    }

    return index_map.get(tsv_type)


def create_index(tsv_type: TableAggType):

    es_index = get_index_name(tsv_type)
    es.options(ignore_status=[400, 404]).indices.delete(index=es_index)
    es.options(ignore_status=[400]).indices.create(index=es_index, settings=add_settings())
     
    if(tsv_type == TableAggType.ANNOTATION.value):
        es.indices.put_mapping(index=es_index, body=annotations_mapping()) 

    return es_index


def add_settings():
    with open(Path('.') / 'data/es_settings/settings.json', 'r') as f:
        data = json.load(f)

    return data


def annotations_mapping():
    with open(Path('.') / 'data/es_settings/annotations_mappings.json', 'r') as f:
        data = json.load(f)

    return data

