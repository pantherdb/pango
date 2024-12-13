import strawberry
from pydantic import typing
from strawberry.types import Info
from src.models.base_model import AutocompleteType, PageArgs, ResultCount
from src.models.gene_model import Gene, GeneStats
from src.config.settings import settings
from src.graphql.graphql_context import GraphQLContext
from src.models.term_model import Term
from src.resolvers.annotation_stats_resolver import get_annotations_count, get_annotations_stats
from src.resolvers.gene_stats_resolver import get_genes_count, get_genes_stats
from src.resolvers.autocomplete_resolver import get_autocomplete, get_slim_term_autocomplete_query_multi
from src.resolvers.annotation_resolver import get_annotation, get_annotations, get_annotations_export, get_genes
from src.models.annotation_model import Annotation, AnnotationExport, AnnotationFilterArgs, AnnotationStats, GeneFilterArgs

@strawberry.type
class FunctionomeQuery:
    
    @staticmethod
    def _get_annotations_index(context: GraphQLContext):
        return context.get_index(settings.PANGO_ANNOTATIONS_INDEX)
    
    @staticmethod
    def _get_genes_index(context: GraphQLContext): 
        return context.get_index(settings.PANGO_GENES_INDEX)

    @strawberry.field
    async def annotation(self, info: Info, id: str) -> Annotation:
        return await get_annotation(FunctionomeQuery._get_annotations_index(info.context), id)

    @strawberry.field
    async def annotations(self, info: Info, filter_args: typing.Optional[AnnotationFilterArgs] = None, 
                         page_args: typing.Optional[PageArgs] = None) -> typing.List[Annotation]:
        return await get_annotations(FunctionomeQuery._get_annotations_index(info.context), filter_args, page_args)
    
    @strawberry.field
    async def genes(self, info: Info, filter_args: typing.Optional[GeneFilterArgs] = None, 
                   page_args: typing.Optional[PageArgs] = None) -> typing.List[Gene]:
        return await get_genes(FunctionomeQuery._get_genes_index(info.context), filter_args, page_args)
    
    @strawberry.field
    async def annotations_export(self, info: Info, filter_args: typing.Optional[AnnotationFilterArgs] = None, 
                               page_args: typing.Optional[PageArgs] = None) -> AnnotationExport:
        return await get_annotations_export(FunctionomeQuery._get_annotations_index(info.context), filter_args, page_args)

    @strawberry.field
    async def annotations_count(self, info: Info, filter_args: typing.Optional[AnnotationFilterArgs] = None) -> ResultCount:
        return await get_annotations_count(FunctionomeQuery._get_annotations_index(info.context), filter_args)
    
    @strawberry.field
    async def genes_count(self, info:Info, filter_args:typing.Optional[GeneFilterArgs]=None) -> ResultCount:
        return await get_genes_count(FunctionomeQuery._get_genes_index(info.context), filter_args)       

    @strawberry.field
    async def annotation_stats(self, info:Info, filter_args:typing.Optional[AnnotationFilterArgs]=None) -> AnnotationStats:
        return await get_annotations_stats(FunctionomeQuery._get_annotations_index(info.context), filter_args)    
    
    @strawberry.field
    async def gene_stats(self, info:Info, filter_args:typing.Optional[GeneFilterArgs]=None) -> GeneStats:
        return await get_genes_stats(FunctionomeQuery._get_genes_index(info.context), filter_args)    
        

    @strawberry.field
    async def autocomplete(self, info:Info, autocomplete_type: AutocompleteType,  keyword:str, filter_args:typing.Optional[GeneFilterArgs]=None,) -> typing.List[Gene]:
        return await get_autocomplete(FunctionomeQuery._get_genes_index(info.context),autocomplete_type, keyword, filter_args)

    @strawberry.field
    async def slim_terms_autocomplete(self, info:Info,  keyword:str, filter_args:typing.Optional[AnnotationFilterArgs]=None) -> typing.List[Term]:
        return await get_slim_term_autocomplete_query_multi(FunctionomeQuery._get_genes_index(info.context), keyword, filter_args)
 
 