from typing import List, Optional
import strawberry

from src.models.base_model import Frequency
from src.models.term_model import Term

@strawberry.type
class Gene:
    gene: str
    gene_symbol: Optional[str]
    gene_name: Optional[str]
    long_id: Optional[str] =  None
    panther_family: Optional[str] =  None
    taxon_abbr: Optional[str] = None
    taxon_label: Optional[str] = None
    taxon_id: Optional[str] = None
    coordinates_chr_num:Optional[str] =  None
    coordinates_start:Optional[int] =  None
    coordinates_end:Optional[int] =  None
    coordinates_strand: Optional[int] =  None
    terms: List[Term]
    slim_terms: List[Term]
    term_count: Optional[int]
    
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