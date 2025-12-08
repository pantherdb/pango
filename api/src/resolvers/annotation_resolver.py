# import load_env
# import asyncio
import json
from src.models.base_model import PageArgs
from src.models.gene_model import Gene
from src.models.annotation_model import Annotation, AnnotationExport, AnnotationFilterArgs, AnnotationMinimal, GeneFilterArgs
from src.config.es import  es
from src.utils import is_valid_filter

async def get_annotation(annotation_index:str, id:str,):

    resp = await es.get(
          index=annotation_index,
          id=id
    )

    results = Annotation(id=resp['_id'], **resp['_source'])
        
    return results    


async def get_annotations(annotation_index:str, filter_args:AnnotationFilterArgs, page_args=PageArgs):

    if page_args is None:
      page_args = PageArgs

    query = await get_annotations_query(filter_args)
    resp = await es.search(
          index=annotation_index,
          filter_path ='took,hits.hits._score,**hits.hits._id**, **hits.hits._source**',
          query=query,
          from_=page_args.page*page_args.size, 
          size=page_args.size,
    )

    results = [Annotation(id=hit['_id'], **hit['_source']) for hit in resp.get('hits', {}).get('hits', [])]
        
    return results    


async def get_genes(gene_index:str, filter_args: GeneFilterArgs, page_args=PageArgs):

    if page_args is None:
        page_args = PageArgs

    # Get the gene IDs based on the filter 
    genes_query = await get_genes_query(filter_args)
    gene_id_resp = await es.search(
        index=gene_index,
        query=genes_query,
        from_=page_args.page * page_args.size,
        size=page_args.size,
        source=["_id"],
        sort=[
          {
              "coordinates_chr_num.keyword": {
                  "order": "asc"
              }
          },
          {
              "gene_symbol.keyword": {
                  "order": "asc"
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
        index=gene_index,
        query=complete_data_query,
        size=len(gene_ids)
    )

    results = [Gene(id=hit['_id'], **hit['_source']) for hit in gene_resp.get('hits', {}).get('hits', [])]

    return results

  
  
async def get_genes_query(filter_args:GeneFilterArgs):
  filters = list()

  if filter_args != None:
    
    term_queries = []
    
    if is_valid_filter(filter_args.term_ids):
        term_queries.extend([
            {
                "nested": {
                    "path": "terms",
                    "query": {
                        "term": {
                            "terms.id.keyword": term_id
                        }
                    }
                }
            }
            for term_id in filter_args.term_ids
        ])
    
    if is_valid_filter(filter_args.slim_term_ids):
        term_queries.extend([
            {
                "nested": {
                    "path": "slim_terms",
                    "query": {
                        "term": {
                            "slim_terms.id.keyword": term_id
                        }
                    }
                }
            }
            for term_id in filter_args.slim_term_ids
        ])
    
    if term_queries:
        filters.append({
            "bool": {
                "must": term_queries
            }
        })
    
        
    if is_valid_filter(filter_args.gene_ids):
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

async def get_annotations_export(annotation_index:str, filter_args:AnnotationFilterArgs, page_args=PageArgs):

    if page_args is None:
      page_args = PageArgs

    query = await get_annotations_query(filter_args)
    resp = await es.search(
          source=['gene', 'gene_symbol', 'term.id', 'term.label'], 
          index=annotation_index,
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
    
    print ('filter_args', filter_args)

    if filter_args is not None:
        if is_valid_filter(filter_args.term_ids):
            filters.append(  
              {           
                "terms": {
                  "term.id.keyword": filter_args.term_ids
                }
              })   
            
        if is_valid_filter(filter_args.term_type_ids):
            filters.append(  
              {           
                "terms": {
                  "term_type": filter_args.term_type_ids
                }
              })         

        if is_valid_filter(filter_args.slim_term_ids):
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
         
        if is_valid_filter(filter_args.gene_ids):
            filters.append(  
              {           
                "terms": {
                  "gene.keyword": filter_args.gene_ids
                }
              })   
            
        if is_valid_filter(filter_args.aspect_ids):
          print ('pooop', filter_args.aspect_ids)
          filters.append(  
            {           
              "terms": {
                "term.aspect.keyword": filter_args.aspect_ids
              }
            })   

        if is_valid_filter(filter_args.evidence_type_ids):
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