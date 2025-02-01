from strawberry.fastapi import BaseContext
from typing import Optional
from src.config.settings import ApiVersion, settings

class GraphQLContext(BaseContext):
    def __init__(self, version: Optional[ApiVersion] = None):
        super().__init__()
        self.version = version or settings.DEFAULT_API_VERSION
    
    def get_index(self, base_index: str) -> str:
        """Get versioned index name"""
        version = self.version
        if version == ApiVersion.LATEST:
            version = ApiVersion.V1
        return f"{version.value}-{base_index}"