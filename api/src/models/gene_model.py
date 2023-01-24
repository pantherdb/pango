import strawberry
from pydantic import  typing

@strawberry.type
class Gene:
    gene: str
    gene_symbol: str
    gene_name: str
    taxon_abbr: str
    taxon_label: str
    taxon_id: str
    coordinates_chr_num:typing.Optional[int] =  None
    coordinates_start:typing.Optional[int] =  None
    coordinates_end:typing.Optional[int] =  None
    coordinates_strand: typing.Optional[int] =  None
    
