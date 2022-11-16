# import load_env
# import asyncio
import pprint
from src.resolvers.annotation_resolver import get_annotations_query
from src.models.annotation_model import Annotation, AnnotationFilterArgs, AutocompleteType
from src.config.settings import settings
from src.config.es import  es

async def get_autocomplete(autocomplete_type: AutocompleteType, keyword:str, filter_args:AnnotationFilterArgs):
    query = {}
    collapse = {}
    if autocomplete_type.value == AutocompleteType.gene.value:
        query, collapse = await get_gene_autocomplete_query(keyword, filter_args)
    elif autocomplete_type.value == AutocompleteType.term.value:
        query, collapse = await get_term_autocomplete_query(keyword, filter_args)
    elif autocomplete_type.value == AutocompleteType.slim_term.value:
        query, collapse = await get_slim_term_autocomplete_query(keyword, filter_args)
    elif autocomplete_type.value == AutocompleteType.evidence_type.value:
        query, collapse = await get_evidence_type_autocomplete_query(keyword, filter_args)
    elif autocomplete_type.value == AutocompleteType.aspect.value:
        query, collapse = await get_aspect_autocomplete_query(keyword, filter_args)
    elif autocomplete_type.value == AutocompleteType.relation.value:
        query, collapse = await get_relation_autocomplete_query(keyword, filter_args)
    elif autocomplete_type.value == AutocompleteType.reference.value:
        query, collapse = await get_reference_autocomplete_query(keyword, filter_args)
    elif autocomplete_type.value == AutocompleteType.withgene.value:
        query, collapse = await get_withgene_autocomplete_query(keyword, filter_args)

    pprint.pprint (query)
    resp = await es.search(
        index = settings.PANTHER_ANNOTATIONS_INDEX,
        filter_path ='took,hits.hits._score,**hits.hits._source**',
        query = query,
        collapse = collapse,
        size=20,
    )
 
    results = [Annotation(**hit['_source']) for hit in resp.get('hits', {}).get('hits', [])]
        
    return results 


async def get_aspect_autocomplete_query(keyword:str, filter_args:AnnotationFilterArgs):
    
    filter_query = await get_annotations_query(filter_args)
    query = {
       "bool": {
         "must": [ 
            {     
              "match": {
                "term.aspect": {
                  "query": keyword,
                  "operator": "and"
                }
              }
            }
         ],
         "filter":filter_query["bool"]["filter"]
       }
    } 
    collapse ={
        "field": "term.aspect.keyword"
    }

    return query, collapse


async def get_evidence_type_autocomplete_query(keyword:str, filter_args:AnnotationFilterArgs):
    
    filter_query = await get_annotations_query(filter_args)
    query = {
       "bool": {
         "must": [ 
            {     
              "match": {
                "evidence_type": {
                  "query": keyword,
                  "operator": "and"
                }
              }
            }
         ],
         "filter":filter_query["bool"]["filter"]
       }
    } 
    collapse ={
        "field": "evidence_type.keyword"
    }

    return query, collapse


async def get_relation_autocomplete_query(keyword:str, filter_args:AnnotationFilterArgs):
    
    filter_query = await get_annotations_query(filter_args)
    query = {
       "bool": {
         "must": [ 
            {     
              "match": {
                "relation": {
                  "query": keyword,
                  "operator": "and"
                }
              }
            }
         ],
         "filter":filter_query["bool"]["filter"]
       }
    }
    collapse ={
        "field": "relation.keyword"
    }

    return query, collapse

    
async def get_gene_autocomplete_query(keyword:str, filter_args:AnnotationFilterArgs):
    filter_query = await get_annotations_query(filter_args)
    query = {
       "bool": {
         "must": [ 
            {     
              "match": {
                "gene": {
                  "query": keyword,
                  "operator": "and"
                }
              }
            }
         ],
         "filter":filter_query["bool"]["filter"]
       }
    }
    collapse ={
        "field": "gene.keyword"
    }

    return query, collapse


async def get_term_autocomplete_query(keyword:str, filter_args:AnnotationFilterArgs):
  
    filter_query = await get_annotations_query(filter_args)
    query = {
       "bool": {
         "must": [ 
            {     
              "match": {
                "term.label": {
                  "query": keyword,
                  "operator": "and"
                }
              }
            }
         ],
         "filter":filter_query["bool"]["filter"]
       }
    }
    collapse ={
        "field": "term.id.keyword"
    }

    return query, collapse

async def get_slim_term_autocomplete_query(keyword:str, filter_args:AnnotationFilterArgs):
  
    filter_query = await get_annotations_query(filter_args)
    query = {
       "bool": {
         "must": [
           {
            "nested": {
              "path":"slim_terms",
              "query": {
                "match": {
                  "slim_term.label": {
                    "query": keyword,
                    "operator": "and"
                  }
                }
              }
            }
           }
         ],
         "filter":filter_query["bool"]["filter"]
       }
    }
    collapse ={
        "field": "slim_term.id.keyword"
    }

    return query, collapse


async def get_reference_autocomplete_query(keyword:str, filter_args:AnnotationFilterArgs):

    filter_query = await get_annotations_query(filter_args)
    query = {
       "bool": {
         "must": [ 
            {     
              "match": {
                  "evidence.references.label": {
                    "query": keyword,
                    "operator": "and"
                  }
                }
            }
         ],
         "filter":filter_query["bool"]["filter"]
       }
    }
    collapse ={
        "field": "references.id.keyword"
    }

    return query, collapse


async def get_withgene_autocomplete_query(keyword:str, filter_args:AnnotationFilterArgs):
  
    filter_query = await get_annotations_query(filter_args)
    query = {
       "bool": {
         "must": [ 
            {     
              "match": {
                 "evidence.with_gene_id.gene": {
                      "query": keyword,
                      "operator": "and"
                  }
                }
            }
         ],
         "filter":filter_query["bool"]["filter"]
       }
    }
    collapse ={
        "field": "evidence.with_gene_id.gene.keyword"
    }

    return query, collapse
  


async def main():
    #results = await get_annotations()
    #pprint.pp(results)
    pass

if __name__ == "__main__":

    #loop = asyncio.get_event_loop()
    #loop.run_until_complete(main())
    #loop.close()
    pass