# import load_env
# import asyncio
import pprint
import typing
from src.models.annotation_model import Annotation, AnnotationFilterArgs, AnnotationStats, Bucket, Frequency, ResultCount
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

    results = [Annotation(**hit['_source']) for hit in resp['hits']['hits']]
        
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
         "qualifier_frequency": {
          "terms": {
            "field": "qualifier.keyword",
             "order":{"_count":"desc"},
             "size": 20
          }
        },
        "references_frequency": {
            "nested": {
              "path": "evidence.references"
            },
            "aggs": {
               "docs": {
                  "top_hits": {
                    "_source":   { 
                        "includes": ["evidence.references.title", "evidence.references.pmid"]
                    }
                  }
                },
                "distinct_references_frequency": {
                  "terms": {
                    "field": "evidence.references.pmid.keyword",
                    "order":{"_count":"desc"},
                    "size": 20
                  }
                }
              }
           }
        
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
        if k=='references_frequency' :
            buckets = [Bucket(**bucket) for bucket in freqs['distinct_references_frequency']['buckets']]
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

      if filter_args.qualifierIds != None and len(filter_args.qualifierIds)>0:
            filters.append(  
              {           
                "terms": {
                  "qualifier.keyword": filter_args.qualifierIds
                }
              }
          )   

    query = {  
      "bool": {  
        "filter": filters
      }
    }
    
    return  query    

async def main():
    results = await get_annotations()
    pprint.pp(results)

if __name__ == "__main__":

    #loop = asyncio.get_event_loop()
    #loop.run_until_complete(main())
    #loop.close()
    pass