import strawberry
from pydantic import Field, typing

@strawberry.type
class Term:
    id: str
    label: typing.Optional[str] = ""
    aspect: typing.Optional[str] = ""
    is_goslim: typing.Optional[bool] = False
    
