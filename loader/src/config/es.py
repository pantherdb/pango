from elasticsearch import Elasticsearch
from src.config.settings import settings


es = Elasticsearch(settings.PANTHER_ES_URL)

