from fastapi import FastAPI, Request
import strawberry
from strawberry.fastapi import GraphQLRouter
from strawberry.schema.config import StrawberryConfig
from strawberry.tools import merge_types
from src.config.settings import settings
from src.graphql.graphql_context import GraphQLContext
from src.middleware.version_manager import VersionManager
from src.graphql.annotation_schema import FunctionomeQuery
from fastapi.middleware.cors import CORSMiddleware

#Queries = merge_types("Queries", AnnotationQuery))

schema = strawberry.Schema(query=FunctionomeQuery, config=StrawberryConfig(auto_camel_case=True))

def create_app():     

  app = FastAPI()

  origins = ["*"]

  app.add_middleware(
      CORSMiddleware,
      allow_origins=origins,
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  
  async def get_context(request: Request) -> GraphQLContext:
    
    version = VersionManager.get_version_from_request(request)
    
    if not version:
        version = settings.DEFAULT_API_VERSION
    
    return GraphQLContext(version=version)
  
  
  graphql_app = GraphQLRouter(
    schema=schema,
    context_getter=get_context
  )

  
  app.include_router(graphql_app, prefix="/graphql")

  return app