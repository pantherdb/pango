import strawberry
import typing
from src.models.evidence_model import Evidence
from src.models.base_model import Frequency
from src.models.term_model import Term

@strawberry.type
class Annotation:
    id: typing.Optional[str] = ''
    gene: str
    gene_symbol: typing.Optional[str]
    gene_name: typing.Optional[str]
    long_id: typing.Optional[str] =  None
    panther_family: typing.Optional[str] =  None
    taxon_abbr: typing.Optional[str] = None
    taxon_label: typing.Optional[str] = None
    taxon_id: typing.Optional[str] = None   
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
class AnnotationStats:
    term_type_frequency: Frequency 
    aspect_frequency: Frequency 
    evidence_type_frequency: Frequency

@strawberry.input
class GeneFilterArgs:
    slim_term_ids: typing.Optional[typing.List[str]] = strawberry.UNSET
    term_ids: typing.Optional[typing.List[str]] = strawberry.UNSET
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

