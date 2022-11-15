from enum import Enum
import strawberry
import typing
from src.models.gene_model import Gene

from src.models.term_model import Term

@strawberry.enum
class AutocompleteType(Enum):
    term = 'term'
    gene = 'gene'
    withgene = "withgene"
    reference = "reference"
    aspect = "aspect"
    relation = "relation"

@strawberry.type
class Entity :
    id: str
    label: str


@strawberry.type
class Reference :
    pmid: str
    title: str
    authors: typing.List[str]
    date: str

@strawberry.type
class Evidence:
    with_gene_id:Gene
    references:typing.List[Reference]

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            if key == 'with_gene_id':
                setattr(self, key, Gene(**value))
            elif key == 'references':
                setattr(self, key, [Reference(**value_k) for value_k in value if value_k != None])
            else:
                setattr(self, key,  value)

@strawberry.type
class ResultCount:
    total: int


@strawberry.type
class Annotation:
    gene: str
    gene_symbol:str
    gene_name:str
    term: Term
    slim_terms: typing.List[Term]
    relation: str
    evidence_type:str
    evidence: typing.List[Evidence] 
    group: typing.Optional[str] = ""

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            if key == 'term':
                setattr(self, key, Term(**value))
            elif key == 'slim_terms':
                setattr(self, key, [Term(**value_k) for value_k in value])
            elif key == 'evidence':
                setattr(self, key, [Evidence(**value_k) for value_k in value])
            else:
                setattr(self, key,  value)
    


@strawberry.type
class Bucket:
    key: str
    doc_count: int
    meta: typing.Optional[Entity] = None


@strawberry.type
class Frequency:
    buckets: typing.List[Bucket]
    
@strawberry.type
class AnnotationStats:
    term_frequency: Frequency 
    aspect_frequency: Frequency 
    evidence_type_frequency: Frequency
    slim_term_frequency: Frequency

@strawberry.input
class AnnotationFilterArgs:
    termIds: typing.Optional[typing.List[str]] = strawberry.UNSET
    geneIds: typing.Optional[typing.List[str]] = strawberry.UNSET,
    aspectIds: typing.Optional[typing.List[str]] = strawberry.UNSET,
    relationIds: typing.Optional[typing.List[str]] = strawberry.UNSET,
    withGeneIds: typing.Optional[typing.List[str]] = strawberry.UNSET,
    referenceIds: typing.Optional[typing.List[str]] = strawberry.UNSET