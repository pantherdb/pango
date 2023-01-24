from enum import Enum
import strawberry
import typing
from src.models.gene_model import Gene

from src.models.term_model import Term

@strawberry.enum
class AutocompleteType(Enum):
    term = 'term'
    slim_term = 'slim_term'
    evidence_type='evidence_type'
    gene = 'gene'
    withgene = "withgene"
    reference = "reference"
    aspect = "aspect"
    qualifier = "qualifier"

@strawberry.type
class Entity :
    id: str
    label: str
    aspect: str


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
    gene_symbol: str
    gene_name: str
    taxon_abbr: str
    taxon_label: str
    taxon_id: str
    coordinates_chr_num:typing.Optional[int] = strawberry.UNSET
    coordinates_start:typing.Optional[int] = strawberry.UNSET
    coordinates_end:typing.Optional[int] = strawberry.UNSET
    coordinates_strand: typing.Optional[int] = strawberry.UNSET
    term: Term
    slim_terms: typing.List[Term]
    qualifier: typing.Optional[str]
    evidence_type:str
    evidence: typing.List[Evidence] 
    groups: typing.List[str]
    evidence_count: int

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
    term_ids: typing.Optional[typing.List[str]] = strawberry.UNSET
    slim_term_ids: typing.Optional[typing.List[str]] = strawberry.UNSET
    evidence_type_ids: typing.Optional[typing.List[str]] = strawberry.UNSET
    gene_ids: typing.Optional[typing.List[str]] = strawberry.UNSET,
    aspect_ids: typing.Optional[typing.List[str]] = strawberry.UNSET,
    qualifier_ids: typing.Optional[typing.List[str]] = strawberry.UNSET,
    with_gene_ids: typing.Optional[typing.List[str]] = strawberry.UNSET,
    reference_ids: typing.Optional[typing.List[str]] = strawberry.UNSET