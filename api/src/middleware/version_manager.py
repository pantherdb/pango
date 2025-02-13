from fastapi import Request
from typing import Optional
from src.config.settings import ApiVersion

class VersionManager:
    @staticmethod
    def get_version_from_request(request: Request) -> Optional[ApiVersion]:
        version = request.headers.get("X-API-Version") or request.query_params.get("version")
        try:
            return ApiVersion(version) if version else None
        except ValueError:
            return None