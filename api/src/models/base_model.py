
from enum import Enum
import typing
import strawberry

@strawberry.enum
class AutocompleteType(Enum):
    slim_term = 'slim_term'
    gene = 'gene'

@strawberry.type
class Entity :
    id: str
    label: str
    aspect: str
    display_id:str


@strawberry.type
class Reference :
    pmid: str
    title: str
    authors: typing.List[str]
    date: str
                
@strawberry.type
class ResultCount:
    total: int
    
@strawberry.type
class Bucket:
    key: str
    doc_count: int
    meta: typing.Optional[Entity] = None


@strawberry.type
class Frequency:
    buckets: typing.List[Bucket]
    
@strawberry.input
class PageArgs:
    page: typing.Optional[int] = 0
    size: typing.Optional[int] = 50