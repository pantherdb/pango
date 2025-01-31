import typing
import strawberry

from src.models.base_model import Reference
from src.models.gene_model import Gene

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
 

