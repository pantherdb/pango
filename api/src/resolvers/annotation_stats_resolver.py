# import load_env
# import asyncio
import pprint
from src.models.base_model import Bucket, Entity, ResultCount
from src.resolvers.annotation_resolver import get_annotations_query
from src.models.annotation_model import  AnnotationFilterArgs, AnnotationStats, Frequency
from src.config.es import  es

async def get_annotations_count(annotation_index:str, filter_args:AnnotationFilterArgs):

    query = await get_annotations_query(filter_args)
    resp = await es.count(
          index=annotation_index,
          query=query,
    )

    results = ResultCount(total=resp['count'])
        
    return results     


async def get_annotations_stats(annotation_index:str, filter_args:AnnotationFilterArgs):
    
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
        }    
    }
    

    resp = await es.search(
          index=annotation_index,
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
    pass

if __name__ == "__main__":

    #loop = asyncio.get_event_loop()
    #loop.run_until_complete(main())
    #loop.close()
    pass
  
  
 