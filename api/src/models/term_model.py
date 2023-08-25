import strawberry
from pydantic import  typing

@strawberry.type
class Term:
    id: str
    label: typing.Optional[str] = ""
    display_id: typing.Optional[str] = ""
    aspect: typing.Optional[str] = ""
    is_goslim: typing.Optional[bool] = False
    count: typing.Optional[int] = 0
    evidence_type:typing.Optional[str] = None
    
