# import load_env
# import asyncio
import pprint
import typing
from src.models.annotation_model import Annotation, AnnotationFilterArgs, AnnotationStats, Bucket, Entity, Frequency, ResultCount
from src.config.settings import settings
from src.config.es import  es

async def get_annotations(filter_args:AnnotationFilterArgs, size=20):

    query = await get_annotations_query(filter_args)
    resp = await es.search(
          index=settings.PANTHER_ANNOTATIONS_INDEX,
          filter_path ='took,hits.hits._score,**hits.hits._source**',
          query=query,
          size=size,
    )

    results = [Annotation(**hit['_source']) for hit in resp.get('hits', {}).get('hits', [])]
        
    return results    

async def get_annotations_count(filter_args:AnnotationFilterArgs, size=20):

    query = await get_annotations_query(filter_args)
    resp = await es.count(
          index=settings.PANTHER_ANNOTATIONS_INDEX,
          query=query,
    )

    results = ResultCount(total=resp['count'])
        
    return results   


async def get_annotations_stats(filter_args:AnnotationFilterArgs):
    
    query = await get_annotations_query(filter_args)
    aggs = {
        "term_frequency": {
          "terms": {
            "field": "term.label.keyword",
            "order":{"_count":"desc"},
            "size": 20
          }
        },
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
        "slim_term_frequency": get_slim_terms_query()
        
    }
    resp = await es.search(
          index=settings.PANTHER_ANNOTATIONS_INDEX,
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
                doc_count=freq_bucket["doc_count"],
                meta = get_response_meta(freq_bucket["docs"])
              ))

        else:
             buckets = [Bucket(**bucket) for bucket in freqs['buckets']]
        
        stats[k] = Frequency(buckets=buckets)
                 
    results = AnnotationStats(**stats)
        
    return results

async def get_annotations_query(filter_args:AnnotationFilterArgs):
  
    filters = list()

    if filter_args != None:
      if filter_args.termIds != None and len(filter_args.termIds)>0:
            filters.append(  
              {           
                "terms": {
                  "term.id.keyword": filter_args.termIds
                }
              }
          )   
         
      if filter_args.geneIds != None and len(filter_args.geneIds)>0:
            filters.append(  
              {           
                "terms": {
                  "gene.keyword": filter_args.geneIds
                }
              }
          )   

      if filter_args.aspectIds != None and len(filter_args.aspectIds)>0:
            filters.append(  
              {           
                "terms": {
                  "term.aspect.keyword": filter_args.aspectIds
                }
              }
          )   

      if filter_args.relationIds != None and len(filter_args.relationIds)>0:
            filters.append(  
              {           
                "terms": {
                  "relation.keyword": filter_args.relationIds
                }
              }
          )   

    query = {  
      "bool": {  
        "filter": filters
      }
    }
    
    return  query    

def get_slim_terms_query():
    
      slim_term_frequency = {
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
                    "includes": ["slim_terms.id", "slim_terms.label"]
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
      return Entity(id=results[0]["_source"]["id"], label=results[0]["_source"]["id"])

   return None

async def main():
    results = await get_annotations()
    pprint.pp(results)

if __name__ == "__main__":

    #loop = asyncio.get_event_loop()
    #loop.run_until_complete(main())
    #loop.close()
    pass