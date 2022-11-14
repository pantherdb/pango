import strawberry
from pydantic import typing
from strawberry.types import Info
from src.resolvers.term_resolver import get_term, get_terms

from src.models.term_model import Term

@strawberry.type
class TermQuery:

    @strawberry.field
    async def terms(self, info:Info) -> typing.List[Term]:
        """ Get all terms """

        terms =  await get_terms()

        return terms

    @strawberry.field
    async def term(self, term_id:str, info:Info) -> typing.List[Term]:
        """ Get all terms """

        print (info)
        terms =  await get_term(term_id)

        return terms
 