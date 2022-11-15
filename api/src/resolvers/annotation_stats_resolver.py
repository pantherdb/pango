# import load_env
# import asyncio
import pprint
import typing
from src.resolvers.annotation_resolver import get_annotations_query
from src.models.annotation_model import Annotation, AnnotationFilterArgs, AnnotationStats, Bucket, Entity, Frequency, ResultCount
from src.config.settings import settings
from src.config.es import  es


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
    results = await get_annotations_stats()
    pprint.pp(results)

if __name__ == "__main__":

    #loop = asyncio.get_event_loop()
    #loop.run_until_complete(main())
    #loop.close()
    pass