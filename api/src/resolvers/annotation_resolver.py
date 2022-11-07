from src.models.annotation_model import Annotation, AnnotationStats, Bucket, Frequency
from src.config.settings import settings
from src.config.es import  es

async def get_annotations():
    resp = await es.search(
          index=settings.PANTHER_ANNOTATIONS_INDEX,
          filter_path ='took,hits.hits._score,**hits.hits._source**',
          query={"match_all": {}},
          size=20,
    )

    results = [Annotation(**hit['_source']) for hit in resp['hits']['hits']]
        
    return results

async def get_annotations_stats():
    
    search_query = {
            "match_all":{},
        }
    aggs = {
        "terms_frequency": {
          "terms": {
            "field": "term.keyword"
          }
        }
    }
    resp = await es.search(
          index=settings.PANTHER_ANNOTATIONS_INDEX,
          filter_path ='took,hits.total.value,aggregations',
          query=search_query,
          aggs=aggs,
          size=0,
    )

    buckets = [Bucket(**bucket) for bucket in resp['aggregations']['terms_frequency']['buckets']]
    freq = Frequency(buckets=buckets)
    results = AnnotationStats(terms_frequency=freq)
        
    return results
