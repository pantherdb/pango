import asyncio
from elasticsearch import AsyncElasticsearch
from src.models.term_model import Term
from src.config.settings import settings
from src.config.es import  es

async def get_terms():
    resp = await es.search(
          index=settings.PANTHER_TERMS_INDEX,
          filter_path ='took,hits.hits._score,**hits.hits._source**',
          query={"match_all": {}},
          size=20,
    )

    results = [Term(**hit['_source']) for hit in resp['hits']['hits']]
        
    return results

async def get_term(term_id:str):
    resp = await es.search(
          index=settings.PANTHER_TERMS_INDEX,
          filter_path ='took,hits.hits._score,**hits.hits._source**',
          query={"match_all": {}},
          size=20,
    )

    results = [Term(**hit['_source']) for hit in resp['hits']['hits']]
        
    return results

