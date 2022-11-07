import os
from pydantic import BaseSettings

class Settings(BaseSettings):

    PANTHER_ES_URL:str = os.environ.get("PANTHER_ES_URL")
    PANTHER_ANNOTATIONS_INDEX :str = os.environ.get("PANTHER_ANNOTATIONS_INDEX")
    PANTHER_TERMS_INDEX:str = os.environ.get("PANTHER_TERMS_INDEX")
    PROJECT_TITLE: str = "Panther Stats loader"
    PROJECT_VERSION: str = "0.0.1"



settings = Settings()