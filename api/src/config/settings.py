import os
from pydantic import BaseSettings

class Settings(BaseSettings):

    PANTHER_ES_URL:str = os.environ.get("PANTHER_ES_URL")
    PANTHER_ANNOTATIONS_INDEX :str = os.environ.get("PANTHER_ANNOTATIONS_INDEX")
    PANTHER_TERMS_INDEX:str = os.environ.get("PANTHER_TERMS_INDEX")
    PROJECT_TITLE: str = "Panther Stats api"
    PROJECT_VERSION: str = "0.0.1"
    HOST_HTTP: str = os.environ.get("HOST_HTTP","http://")
    HOST_URL: str = os.environ.get("HOST_URL")
    HOST_PORT: int = int(os.environ.get("HOST_PORT"))
    BASE_URL: str = HOST_HTTP+HOST_URL+":"+str(HOST_PORT)



settings = Settings()