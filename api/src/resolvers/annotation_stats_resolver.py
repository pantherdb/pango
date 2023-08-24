# import load_env
# import asyncio
import pprint
import typing
from src.resolvers.annotation_resolver import get_annotations_query, get_genes_query
from src.models.annotation_model import  AnnotationFilterArgs, AnnotationStats, Bucket, Entity, Frequency, GeneFilterArgs, ResultCount
from src.config.settings import settings
from src.config.es import  es

async def get_annotations_count(filter_args:AnnotationFilterArgs):

    query = await get_annotations_query(filter_args)
    resp = await es.count(
          index=settings.PANGO_ANNOTATIONS_INDEX,
          query=query,
    )

    results = ResultCount(total=resp['count'])
        
    return results   


async def get_genes_count(filter_args:GeneFilterArgs):

    query = await get_genes_query(filter_args)
    resp = await es.count(
          index=settings.PANGO_GENES_INDEX,
          query=query
    )
    
    results = ResultCount(total=resp['count'])
        
    return results  


async def get_annotations_stats(filter_args:AnnotationFilterArgs):
    
    query = await get_annotations_query(filter_args)
    aggs = {     
        "aspect_frequency": {
          "terms": {
            "field": "term.aspect.keyword",
             "order":{"_count":"desc"},
             "size": 20
          }
        },
         "evidence_type_frequency": {
          "terms": {
            "field": "evidence_type.keyword",
             "order":{"_count":"desc"},
             "size": 20
          }
        },
        "term_type_frequency": {
          "terms": {
            "field": "term_type.keyword",
            "order":{"_count":"desc"},
            "size": 2
          }
        },
        "slim_term_frequency": get_slim_terms_query()        
    }
    

    resp = await es.search(
          index=settings.PANGO_ANNOTATIONS_INDEX,
          filter_path ='took,hits.total.value,aggregations',
          query=query,
          aggs=aggs,
          size=0,
    )

    stats = dict()
    for k, freqs in resp['aggregations'].items():   
        buckets = None
        if k=='slim_term_frequency' :
            buckets = list()
            for freq_bucket in freqs['distinct_slim_term_frequency']['buckets']:     

                buckets.append(Bucket(
                  key=freq_bucket["key"],
                  doc_count=freq_bucket["distinct_genes"]["gene_count"]["value"],
                  meta = get_response_meta(freq_bucket["docs"])
                ))
            stats[k] = Frequency(buckets=buckets)
        elif k =='distinct_gene_count':
            stats[k] = freqs['value']
        else:
            buckets = [Bucket( key=bucket["key"], doc_count=bucket["doc_count"])
                        for bucket in freqs['buckets']]
            stats[k] = Frequency(buckets=buckets)
                         
    results = AnnotationStats(**stats)
        
    return results

def get_slim_terms_query():
    
      slim_term_frequency =  {
            "nested": {
              "path": "slim_terms"
            },
            "aggs": {
              "distinct_slim_term_frequency": {
                "terms": {
                  "field": "slim_terms.label.keyword",
                  "order": {
                    "_count": "desc"
                  },
                  "size": 200
                },
                "aggs": {
                  "distinct_genes": {
                    "reverse_nested": {},
                    "aggs": {
                      "gene_count": {
                        "cardinality": {
                          "field": "gene.keyword"
                        }
                      }
                    }
                  },
                  "docs": {
                    "top_hits": {
                      "_source": {
                        "includes": [
                          "slim_terms.id",
                          "slim_terms.label",
                          "slim_terms.aspect"
                        ]
                      },
                      "size": 1
                    }
                  }
                }
              }
            }
          }

      return slim_term_frequency

def get_response_meta(bucket):
   results = [hit for hit in bucket.get('hits', {}).get('hits', [])]

   if len(results) > 0:
      idx=results[0]["_source"]["id"]
      return Entity(
        id=idx, 
        label=results[0]["_source"]["label"], 
        aspect=results[0]["_source"]["aspect"],
        display_id= idx if idx.startswith("GO") else '')

   return None


async def main():
    results = await get_annotations_stats()
    pprint.pp(results)

if __name__ == "__main__":

    #loop = asyncio.get_event_loop()
    #loop.run_until_complete(main())
    #loop.close()
    pass
  
  
 