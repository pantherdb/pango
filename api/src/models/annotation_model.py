from enum import Enum
import strawberry
import typing
from src.models.term_model import Term


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
class Gene:
    gene: str
    gene_symbol: typing.Optional[str]
    gene_name: typing.Optional[str]
    long_id: typing.Optional[str] =  None
    panther_family: typing.Optional[str] =  None
    taxon_abbr: typing.Optional[str]
    taxon_label: typing.Optional[str]
    taxon_id: typing.Optional[str]
    coordinates_chr_num:typing.Optional[str] =  None
    coordinates_start:typing.Optional[int] =  None
    coordinates_end:typing.Optional[int] =  None
    coordinates_strand: typing.Optional[int] =  None
    terms: typing.List[Term]
    slim_terms: typing.List[Term]
    term_count: typing.Optional[int]
    
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            if key == 'slim_terms' or key == 'terms':
                setattr(self, key, [self.add_term_display_id(value_k) for value_k in value])
            else:
                setattr(self, key,  value)
                
                
    def add_term_display_id(self, value):
        term = Term(**value)
        term.display_id = term.id if term.id.startswith("GO") else ''
        return term
    

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
    id: typing.Optional[str] = ''
    gene: str
    gene_symbol: typing.Optional[str]
    gene_name: typing.Optional[str]
    long_id: typing.Optional[str] =  None
    panther_family: typing.Optional[str] =  None
    taxon_abbr: typing.Optional[str]
    taxon_label: typing.Optional[str]
    taxon_id: typing.Optional[str]    
    coordinates_chr_num:typing.Optional[str] =  None
    coordinates_start:typing.Optional[int] =  None
    coordinates_end:typing.Optional[int] =  None
    coordinates_strand: typing.Optional[int] =  None
    term_type: typing.Optional[str]
    term: typing.Optional[Term]
    slim_terms: typing.List[Term]
    evidence_type:typing.Optional[str] = None
    evidence: typing.List[Evidence] 
    groups: typing.List[str]
    evidence_count: typing.Optional[int]

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            if key == 'term':
                setattr(self, key, self.add_term_display_id(value) )
            elif key == 'slim_terms':
                setattr(self, key, [self.add_term_display_id(value_k) for value_k in value])
            elif key == 'evidence':
                setattr(self, key, [Evidence(**value_k) for value_k in value])
            else:
                setattr(self, key,  value)

    def add_term_display_id(self, value):
        term = Term(**value)
        term.display_id = term.id if term.id.startswith("GO") else ''
        return term


@strawberry.type
class AnnotationGroup:
    name: str
    annotations: typing.List[Annotation]

@strawberry.type
class AnnotationMinimal:
    gene: str
    gene_symbol: typing.Optional[str]
    term_id: typing.Optional[str]
    term_label: typing.Optional[str]

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            if key == 'term':
                setattr(self, 'term_id', value['id'] )
                setattr(self, 'term_label', value['label'] )
            else:
                setattr(self, key,  value)
    
@strawberry.type
class AnnotationExport:
    data: str

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
    term_type_frequency: Frequency 
    aspect_frequency: Frequency 
    evidence_type_frequency: Frequency
    slim_term_frequency: Frequency

@strawberry.input
class GeneFilterArgs:
    slim_term_ids: typing.Optional[typing.List[str]] = strawberry.UNSET
    gene_ids: typing.Optional[typing.List[str]] = strawberry.UNSET,
    

@strawberry.input
class AnnotationFilterArgs:
    term_ids: typing.Optional[typing.List[str]] = strawberry.UNSET
    term_type_ids: typing.Optional[typing.List[str]] = strawberry.UNSET
    slim_term_ids: typing.Optional[typing.List[str]] = strawberry.UNSET
    evidence_type_ids: typing.Optional[typing.List[str]] = strawberry.UNSET
    gene_ids: typing.Optional[typing.List[str]] = strawberry.UNSET,
    aspect_ids: typing.Optional[typing.List[str]] = strawberry.UNSET,
    with_gene_ids: typing.Optional[typing.List[str]] = strawberry.UNSET,
    reference_ids: typing.Optional[typing.List[str]] = strawberry.UNSET

@strawberry.input
class PageArgs:
    page: typing.Optional[int] = 0
    size: typing.Optional[int] = 50