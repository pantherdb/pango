import os
from pydantic_settings import BaseSettings
from typing import Optional
from enum import Enum

class ApiVersion(str, Enum):
    V2023 = "pango-2023"
    V2024 = "pango-2024"
    LATEST = "latest"

class Settings(BaseSettings):
    DEBUG: bool = bool(os.environ.get("DEBUG"))
    PANGO_ES_URL: str = os.environ.get("PANGO_ES_URL")
    PANGO_ANNOTATIONS_INDEX: str = os.environ.get("PANGO_ANNOTATIONS_INDEX")
    PANGO_GENES_INDEX: str = os.environ.get("PANGO_GENES_INDEX")
    PROJECT_TITLE: str = "PANGO"
    PROJECT_VERSION: str = "0.0.1"
    HOST_HTTP: str = os.environ.get("HOST_HTTP", "http://")
    HOST_URL: str = os.environ.get("HOST_URL")
    HOST_PORT: int = int(os.environ.get("HOST_PORT"))
    DEFAULT_API_VERSION: ApiVersion = ApiVersion.LATEST

    @property
    def BASE_URL(self) -> str:
        return self.HOST_HTTP + self.HOST_URL + ":" + str(self.HOST_PORT)

    def get_versioned_index(self, index_name: str, version: Optional[ApiVersion] = None) -> str:
        """Simply prepends the version to the full index name"""
        version = version or self.DEFAULT_API_VERSION
        if version == ApiVersion.LATEST:
            version = ApiVersion.V2024 
        
        return f"{version}-{index_name}"

settings = Settings()