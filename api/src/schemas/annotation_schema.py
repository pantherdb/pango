import strawberry
from pydantic import typing
from strawberry.types import Info
from src.resolvers.annotation_resolver import get_annotations, get_annotations_stats
from src.models.annotation_model import Annotation, AnnotationStats
from src.utils import get_selected_fields

@strawberry.type
class AnnotationQuery:

    @strawberry.field
    async def annotations(self, info:Info) -> typing.List[Annotation]:
        """ Get all annotations """

        print("---", get_selected_fields(info))
        annotations =  await get_annotations()

        return annotations

    @strawberry.field
    async def stats(self, info:Info) -> AnnotationStats:
        """ Get all annotations """

        print("---", get_selected_fields(info))
        aggregations = await get_annotations_stats()

        return aggregations
 
 