import strawberry
from pydantic import typing
from strawberry.types import Info
from src.resolvers.annotation_stats_resolver import get_annotations_stats
from src.resolvers.autocomplete_resolver import get_autocomplete
from src.resolvers.annotation_resolver import get_annotations, get_annotations_count
from src.models.annotation_model import Annotation, AnnotationFilterArgs, AnnotationStats, AutocompleteType, ResultCount
from src.utils import get_selected_fields

@strawberry.type
class AnnotationQuery:

    @strawberry.field
    async def annotations(self, info:Info, filter_args:typing.Optional[AnnotationFilterArgs]=None) -> typing.List[Annotation]:
        return await get_annotations(filter_args)

    @strawberry.field
    async def annotations_count(self, info:Info, filter_args:typing.Optional[AnnotationFilterArgs]=None) -> ResultCount:
        return await get_annotations_count(filter_args)     

    @strawberry.field
    async def stats(self, info:Info, filter_args:typing.Optional[AnnotationFilterArgs]=None) -> AnnotationStats:
        return await get_annotations_stats(filter_args)       

    @strawberry.field
    async def autocomplete(self, info:Info, autocomplete_type: AutocompleteType,  keyword:str, filter_args:typing.Optional[AnnotationFilterArgs]=None,) -> typing.List[Annotation]:
        return await get_autocomplete(autocomplete_type, keyword, filter_args)
 
 