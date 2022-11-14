# import load_env
# import asyncio
from src.models.annotation_model import Annotation, AnnotationFilterArgs, AutocompleteType
from src.config.settings import settings
from src.config.es import  es

async def get_autocomplete(autocomplete_type: AutocompleteType, keyword:str):
    query = {}
    collapse = {}
    if autocomplete_type.value == AutocompleteType.gene.value:
        query, collapse = await get_gene_autocomplete_query(keyword)
    elif autocomplete_type.value == AutocompleteType.term.value:
        query, collapse = await get_term_autocomplete_query(keyword)
    elif autocomplete_type.value == AutocompleteType.aspect.value:
        query, collapse = await get_aspect_autocomplete_query(keyword)
    elif autocomplete_type.value == AutocompleteType.qualifier.value:
        query, collapse = await get_qualifier_autocomplete_query(keyword)
    elif autocomplete_type.value == AutocompleteType.reference.value:
        query, collapse = await get_reference_autocomplete_query(keyword)
    elif autocomplete_type.value == AutocompleteType.withgene.value:
        query, collapse = await get_withgene_autocomplete_query(keyword)


    resp = await es.search(
        index = settings.PANTHER_ANNOTATIONS_INDEX,
        filter_path ='took,hits.hits._score,**hits.hits._source**',
        query = query,
        collapse = collapse,
        size=20,
    )

    results = [Annotation(**hit['_source']) for hit in resp['hits']['hits']]
        
    return results  

  
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

    query = {  
      "bool": {  
        "filter": filters
      }
    }
    
    return  query    

async def get_aspect_autocomplete_query(keyword:str):
    query = {
          "match": {
              "term.aspect": {
                  "query": keyword,
                  "operator": "and"
              }
          }
      }
    collapse ={
        "field": "term.aspect.keyword"
    }

    return query, collapse

async def get_qualifier_autocomplete_query(keyword:str):
    query = {
          "match": {
              "qualifier": {
                  "query": keyword,
                  "operator": "and"
              }
          }
      }
    collapse ={
        "field": "qualifier.keyword"
    }

    return query, collapse

async def get_gene_autocomplete_query(keyword:str):
    query = {
          "match": {
              "gene": {
                  "query": keyword,
                  "operator": "and"
              }
          }
      }
    collapse ={
        "field": "gene.keyword"
    }

    return query, collapse


async def get_term_autocomplete_query(keyword:str):
    query = {
          "match": {
              "term.label": {
                  "query": keyword,
                  "operator": "and"
              }
          }
      }
    collapse ={
        "field": "term.id.keyword"
    }

    return query, collapse

async def get_reference_autocomplete_query(keyword:str):
    query = {
          "match": {
              "evidence.references.label": {
                  "query": keyword,
                  "operator": "and"
              }
          }
      }
    collapse ={
        "field": "references.id.keyword"
    }

    return query, collapse


async def get_withgene_autocomplete_query(keyword:str):
    query = {
          "match": {
              "evidence.with_gene_id.gene": {
                  "query": keyword,
                  "operator": "and"
              }
          }
      }
    collapse ={
        "field": "evidence.with_gene_id.gene.keyword"
    }

    return query, collapse
  


async def main():
    #results = await get_annotations()
    #pprint.pp(results)
    pass

if __name__ == "__main__":

    #loop = asyncio.get_event_loop()
    #loop.run_until_complete(main())
    #loop.close()
    pass