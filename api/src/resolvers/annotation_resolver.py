# import load_env
# import asyncio
import pprint
import typing
from src.models.annotation_model import Annotation, AnnotationFilterArgs,PageArgs, ResultCount
from src.config.settings import settings
from src.config.es import  es

async def get_annotations(filter_args:AnnotationFilterArgs, page_args=PageArgs):

    if page_args is None:
      page_args = PageArgs

    query = await get_annotations_query(filter_args)
    resp = await es.search(
          index=settings.PANTHER_ANNOTATIONS_INDEX,
          filter_path ='took,hits.hits._score,**hits.hits._source**',
          query=query,
          from_=page_args.page*page_args.size,
          size=page_args.size,
    )

    results = [Annotation(**hit['_source']) for hit in resp.get('hits', {}).get('hits', [])]
        
    return results    




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

      if filter_args.qualifier_ids != None and len(filter_args.qualifier_ids)>0:
            filters.append(  
              {           
                "terms": {
                  "qualifier.keyword": filter_args.qualifier_ids
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