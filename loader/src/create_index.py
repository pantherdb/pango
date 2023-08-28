import json
from pathlib import Path
from src.config.base import TableAggType
from src.config.settings import settings
from src.config.es import es


def get_index_name(tsv_type: TableAggType):
    index_map = {
        'annotations': settings.PANGO_ANNOTATIONS_INDEX,
        'genes': settings.PANGO_GENES_INDEX
    }

    return index_map.get(tsv_type)


def create_index(tsv_type: TableAggType):

    es_index = get_index_name(tsv_type)
    es.options(ignore_status=[400, 404]).indices.delete(index=es_index)
    es.options(ignore_status=[400, 404]).indices.create(index=es_index, settings=add_settings())
     
    if(tsv_type == TableAggType.ANNOTATIONS.value):
        es.indices.put_mapping(index=es_index, body=annotations_mapping())         
    elif(tsv_type == TableAggType.GENES.value):
        es.indices.put_mapping(index=es_index, body=genes_mapping()) 

    return es_index


def add_settings():
    with open(Path('.') / 'data/es_settings/settings.json', 'r') as f:
        data = json.load(f)

    return data


def annotations_mapping():
    with open(Path('.') / 'data/es_settings/annotations_mappings.json', 'r') as f:
        data = json.load(f)

    return data

def genes_mapping():
    with open(Path('.') / 'data/es_settings/genes_mappings.json', 'r') as f:
        data = json.load(f)

    return data

