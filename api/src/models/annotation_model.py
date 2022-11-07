import strawberry
import typing

@strawberry.type
class Annotation:
    gene: str
    term: str
    slim_terms: typing.List[str]
    qualifiers: typing.List[str]
    reference: str
    group: typing.Optional[str] = ""
    


@strawberry.type
class Bucket:
    key: str
    doc_count: int

@strawberry.type
class Frequency:
    buckets: typing.List[Bucket]
    
@strawberry.type
class AnnotationStats:
    terms_frequency: Frequency 