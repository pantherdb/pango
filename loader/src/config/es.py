from elasticsearch import Elasticsearch
from src.config.settings import settings


es = Elasticsearch(settings.PANGO_ES_URL)

