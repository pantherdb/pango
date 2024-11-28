from fastapi import HTTPException

class VersionError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=400, detail=detail)

class IndexError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=400, detail=detail)

class DocumentNotFoundError(HTTPException):
    def __init__(self, index: str, id: str):
        super().__init__(
            status_code=404, 
            detail=f"Document with id '{id}' not found in index '{index}'"
        )