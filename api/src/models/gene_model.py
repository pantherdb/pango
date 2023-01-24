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
    coordinates_chr_num:typing.Optional[int]=  strawberry.UNSET
    coordinates_start:typing.Optional[int]=  strawberry.UNSET
    coordinates_end:typing.Optional[int]=  strawberry.UNSET
    coordinates_strand: typing.Optional[int]=  strawberry.UNSET
    
