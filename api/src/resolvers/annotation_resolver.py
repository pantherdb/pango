# import load_env
# import asyncio
import json
import pprint
import typing
from src.models.annotation_model import Annotation, AnnotationExport, AnnotationFilterArgs, AnnotationGroup, AnnotationMinimal,PageArgs, ResultCount
from src.config.settings import settings
from src.config.es import  es

async def get_annotation(id:str):

    resp = await es.get(
          index=settings.PANTHER_ANNOTATIONS_INDEX,
          id=id
    )

    results = Annotation(id=resp['_id'], **resp['_source'])
        
    return results    


async def get_annotations(filter_args:AnnotationFilterArgs, page_args=PageArgs):

    if page_args is None:
      page_args = PageArgs

    query = await get_annotations_query(filter_args)
    resp = await es.search(
          index=settings.PANTHER_ANNOTATIONS_INDEX,
          filter_path ='took,hits.hits._score,**hits.hits._id**, **hits.hits._source**',
          query=query,
          from_=page_args.page*page_args.size,
          size=page_args.size,
    )

    results = [Annotation(id=hit['_id'], **hit['_source']) for hit in resp.get('hits', {}).get('hits', [])]
        
    return results    


async def get_grouped_annotations(filter_args:AnnotationFilterArgs, page_args=PageArgs, group_by='gene'):

    if page_args is None:
        page_args = PageArgs

    gene_query = await get_annotations_query(filter_args)
    gene_resp = await es.search(
        index=settings.PANTHER_ANNOTATIONS_INDEX,
        query=gene_query,
        aggs=await get_grouped_aggs_query(group_by, page_args),
        size=0,
    )

    gene_keys = [bucket["key"] for bucket in gene_resp["aggregations"][group_by]["buckets"]]

    # Second Query: Retrieve all annotations for the genes identified in the first query
    annotations_query = {
        "terms": {
            f"{group_by}.keyword": gene_keys
        }
    }
    annotations_resp = await es.search(
        index=settings.PANTHER_ANNOTATIONS_INDEX,
        query=annotations_query,
        size=0,
        source= {
          "excludes": ["evidence"]
        },
        aggs={
            "genes_grouped": {
                "terms": {
                    "field": f"{group_by}.keyword",
                    "size": 1000  
                },
                "aggs": {
                    "gene_annotations": {
                        "top_hits": {
                            "_source": {
                              "excludes": ["evidence"]
                            },
                            "size": 100
                        }
                    }
                }
            }
        }
    )

    results = await get_results(annotations_resp, "genes_grouped")
    return results  
  
  

async def get_annotations_export(filter_args:AnnotationFilterArgs, page_args=PageArgs):

    if page_args is None:
      page_args = PageArgs

    query = await get_annotations_query(filter_args)
    resp = await es.search(
          source=['gene', 'gene_symbol', 'term.id', 'term.label'], 
          index=settings.PANTHER_ANNOTATIONS_INDEX,
          filter_path ='took,hits.hits._score,**hits.hits._source**',
          query=query,
          from_=page_args.page*page_args.size,
          size=10000,
    )

    results = [AnnotationMinimal(**hit['_source']) for hit in resp.get('hits', {}).get('hits', [])]
    data = AnnotationExport(data=json.dumps(results, default=lambda x: x.__dict__))

    return data   


async def get_annotations_query(filter_args:AnnotationFilterArgs):
  
    filters = list()

    if filter_args != None:
      if filter_args.term_ids != None and len(filter_args.term_ids)>0:
            filters.append(  
              {           
                "terms": {
                  "term.id.keyword": filter_args.term_ids
                }
              })   
            
      if filter_args.term_ids != None and len(filter_args.term_type_ids)>0:
        filters.append(  
          {           
            "terms": {
              "term_type": filter_args.term_type_ids
            }
          })         

      if filter_args.slim_term_ids != None and len(filter_args.slim_term_ids)>0:
            filters.append( 
              {
               "nested": {
                  "path":"slim_terms",
                  "query": {
                    "terms": {
                      "slim_terms.id.keyword": filter_args.slim_term_ids
                    }
                  }
                }
            })
         
      if filter_args.gene_ids != None and len(filter_args.gene_ids)>0:
            filters.append(  
              {           
                "terms": {
                  "gene.keyword": filter_args.gene_ids
                }
              })   

      if filter_args.aspect_ids != None and len(filter_args.aspect_ids)>0:
            filters.append(  
              {           
                "terms": {
                  "term.aspect.keyword": filter_args.aspect_ids
                }
              })   

      if filter_args.evidence_type_ids != None and len(filter_args.evidence_type_ids)>0:
            filters.append(  
              {           
                "terms": {
                  "evidence_type.keyword": filter_args.evidence_type_ids
                }
              }) 
   
    query = {  
      "bool": {  
        "filter": filters
      }
    }
    
    return query 

async def get_results(resp, group_by) -> typing.List[AnnotationGroup]:
    results = list()
    for bucket in resp["aggregations"][group_by]["buckets"]:
      hits = bucket["gene_annotations"]["hits"]["hits"]
      annotations = [Annotation(id=hit['_id'], **hit['_source']) for hit in hits]
      group = AnnotationGroup(name=bucket["key"], annotations=annotations)
      results.append(group)
        
    return results   
    

async def get_grouped_aggs_query(group_by, page_args:PageArgs):
    aggs = {
      group_by: {
        "terms": {
          "field": "gene.keyword",
          "size": page_args.size,
          #"from": page_args.page*page_args.size,
        }
      }
    }

    return aggs
     


async def main():
    #results = await get_annotations()
   # pprint.pp(results)
   pass

if __name__ == "__main__":

    #loop = asyncio.get_event_loop()
    #loop.run_until_complete(main())
    #loop.close()
    pass