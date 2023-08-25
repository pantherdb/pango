import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    DEBUG:bool = bool(os.environ.get("DEBUG"))
    PANGO_ES_URL:str = os.environ.get("PANGO_ES_URL")
    PANGO_ANNOTATIONS_INDEX :str = os.environ.get("PANGO_ANNOTATIONS_INDEX")
    PANGO_GENES_INDEX:str = os.environ.get("PANGO_GENES_INDEX")
    PROJECT_TITLE: str = "Pango Stats api"
    PROJECT_VERSION: str = "0.0.1"
    HOST_HTTP: str = os.environ.get("HOST_HTTP","http://")
    HOST_URL: str = os.environ.get("HOST_URL")
    HOST_PORT: int = int(os.environ.get("HOST_PORT"))
    BASE_URL: str = HOST_HTTP+HOST_URL+":"+str(HOST_PORT)



settings = Settings()