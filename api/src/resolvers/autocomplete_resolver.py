# import load_env
# import asyncio
import pprint
import typing
from src.models.term_model import Term
from src.resolvers.annotation_stats_resolver import get_response_meta
from src.resolvers.annotation_resolver import get_annotations_query, get_genes_query
from src.models.annotation_model import Annotation, AnnotationFilterArgs, AnnotationStats, AutocompleteType, Bucket, Frequency, Gene, GeneFilterArgs
from src.config.settings import settings
from src.config.es import  es

async def get_autocomplete(autocomplete_type: AutocompleteType, keyword:str, filter_args:GeneFilterArgs):
    query = {}
    collapse = {}
    if autocomplete_type.value == AutocompleteType.gene.value:
        query, collapse = await get_gene_autocomplete_query(keyword, filter_args)
    elif autocomplete_type.value == AutocompleteType.slim_term.value:
        query, collapse = await get_slim_term_autocomplete_query(keyword, filter_args)

    resp = await es.search(
        index = settings.PANGO_GENES_INDEX,
        filter_path ='took,hits.hits._score,**hits.hits._id**,**hits.hits._source**',
        query = query,
        collapse = collapse,
        size=20,
    )
 
    results = [Gene(id=hit['_id'], **hit['_source']) for hit in resp.get('hits', {}).get('hits', [])]
        
    return results 


   
async def get_gene_autocomplete_query(keyword:str, filter_args:GeneFilterArgs):
    # filter_query = await get_genes_query(filter_args)
    query = {
      "multi_match": {
        "query": keyword,
        "fields": ["gene", "gene_symbol", "gene_name"],
        "type": "best_fields"
      }  
     }
    collapse ={
        "field": "gene.keyword"
    }

    return query, collapse


async def get_slim_term_autocomplete_query_multi(keyword:str, filter_args:AnnotationFilterArgs)->typing.List[Term]:
  
    filter_query = await get_annotations_query(filter_args)
    query = {
      "bool":{
        "filter":filter_query["bool"]["filter"],
        "must":[
          {
            "nested": {
              "path":"slim_terms",
              "query": {
                "multi_match" : {
                  "query":      keyword,
                  "type":       "phrase_prefix",
                  "fields":     [ "slim_terms.id", "slim_terms.label"]
                }                  
              }
            }
          }
        ]
      }
    }
      
    aggs = {
      "slim_term_frequency": {
        "nested": {
          "path": "slim_terms"
        },
        "aggs": {
            "distinct_slim_term_frequency": {
              "terms": {
                "field": "slim_terms.label.keyword",
                "order":{"_count":"desc"},
                "size": 20
              },
              "aggs": {
                "docs": {
                  "top_hits": {
                    "_source":   { 
                    "includes": ["slim_terms.id", "slim_terms.label", "slim_terms.aspect"]
                    },
                    "size": 1
                  }
                }
              }
            }
          }
        }
      }     

    resp = await es.search(
      index=settings.PANGO_GENES_INDEX,
      query=query,
      aggs=aggs,
      size=0,
    )

    freqs = resp['aggregations']['slim_term_frequency']
    terms = list()
    for freq_bucket in freqs['distinct_slim_term_frequency']['buckets']:     
      meta = get_response_meta(freq_bucket["docs"])
      terms.append(Term(
        id=meta.id,
        label=meta.label,
        aspect=meta.aspect,
        count=freq_bucket["doc_count"]
      ))        
                         
    return terms

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


async def main():
    #results = await get_annotations()
    #pprint.pp(results)
    pass

if __name__ == "__main__":

    #loop = asyncio.get_event_loop()
    #loop.run_until_complete(main())
    #loop.close()
    pass