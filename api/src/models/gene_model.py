import typing
import strawberry

from src.models.base_model import Frequency
from src.models.term_model import Term

@strawberry.type
class Gene:
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
class GeneStats:
    slim_term_frequency: Frequency