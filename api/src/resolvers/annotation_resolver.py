# import load_env
# import asyncio
import json
import pprint
import typing
from src.models.annotation_model import Annotation, AnnotationExport, AnnotationFilterArgs, AnnotationGroup, AnnotationMinimal, Gene, GeneFilterArgs,PageArgs, ResultCount
from src.config.settings import settings
from src.config.es import  es

async def get_annotation(id:str):

    resp = await es.get(
          index=settings.PANGO_ANNOTATIONS_INDEX,
          id=id
    )

    results = Annotation(id=resp['_id'], **resp['_source'])
        
    return results    


async def get_annotations(filter_args:AnnotationFilterArgs, page_args=PageArgs):

    if page_args is None:
      page_args = PageArgs

    query = await get_annotations_query(filter_args)
    resp = await es.search(
          index=settings.PANGO_ANNOTATIONS_INDEX,
          filter_path ='took,hits.hits._score,**hits.hits._id**, **hits.hits._source**',
          query=query,
          from_=page_args.page*page_args.size,
          size=page_args.size,
    )

    results = [Annotation(id=hit['_id'], **hit['_source']) for hit in resp.get('hits', {}).get('hits', [])]
        
    return results    


async def get_genes(filter_args: GeneFilterArgs, page_args=PageArgs):

    if page_args is None:
        page_args = PageArgs

    # Get the gene IDs based on the filter 
    genes_query = await get_genes_query(filter_args)
    gene_id_resp = await es.search(
        index=settings.PANGO_GENES_INDEX,
        query=genes_query,
        from_=page_args.page * page_args.size,
        size=page_args.size,
        source=["_id"],
        sort=[
            {
                "term_count": {
                    "order": "desc"
                }
            }
        ]
    )

    gene_ids = [hit['_id'] for hit in gene_id_resp.get('hits', {}).get('hits', [])]

    if not gene_ids:
        return []

    # Fetch the complete gene data using the IDs
    complete_data_query = {
            "ids": {
                "values": gene_ids
            }
      }

    gene_resp = await es.search(
        index=settings.PANGO_GENES_INDEX,
        query=complete_data_query,
        size=len(gene_ids)
    )

    results = [Gene(id=hit['_id'], **hit['_source']) for hit in gene_resp.get('hits', {}).get('hits', [])]

    return results

  
  
async def get_genes_query(filter_args:GeneFilterArgs):
  filters = list()

  if filter_args != None:
                
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

    
    query = {  
      "bool": {  
        "filter": filters
      }
    }
    
    return query 

async def get_annotations_export(filter_args:AnnotationFilterArgs, page_args=PageArgs):

    if page_args is None:
      page_args = PageArgs

    query = await get_annotations_query(filter_args)
    resp = await es.search(
          source=['gene', 'gene_symbol', 'term.id', 'term.label'], 
          index=settings.PANGO_ANNOTATIONS_INDEX,
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
            
      if filter_args.term_type_ids != None and len(filter_args.term_type_ids)>0:
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
  

async def main():
    #results = await get_annotations()
   # pprint.pp(results)
   pass

if __name__ == "__main__":

    #loop = asyncio.get_event_loop()
    #loop.run_until_complete(main())
    #loop.close()
    pass