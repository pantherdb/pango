import strawberry
from pydantic import  typing

@strawberry.type
class Gene:
    gene: str
    gene_symbol: str
    gene_name: str
    long_id: typing.Optional[str] =  None
    panther_family: typing.Optional[str] =  None
    taxon_abbr: str
    taxon_label: str
    taxon_id: str
    coordinates_chr_num:typing.Optional[str] =  None
    coordinates_start:typing.Optional[int] =  None
    coordinates_end:typing.Optional[int] =  None
    coordinates_strand: typing.Optional[int] =  None
    
