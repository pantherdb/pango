import os
from elasticsearch import AsyncElasticsearch
from src.config.settings import settings

es = AsyncElasticsearch(settings.PANTHER_ES_URL,
    maxsize=400,
    timeout=120,
    max_retries=10,
    retry_on_timeout=True)


