import strawberry
from pydantic import  typing

@strawberry.type
class Gene:
    gene: str
    gene_symbol: str
    gene_name: str
    
