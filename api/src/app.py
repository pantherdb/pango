from fastapi import FastAPI
import strawberry
from strawberry.fastapi import GraphQLRouter
from strawberry.schema.config import StrawberryConfig
from strawberry.tools import merge_types
from src.schemas.annotation_schema import AnnotationQuery
from fastapi.middleware.cors import CORSMiddleware

#Queries = merge_types("Queries", AnnotationQuery))

schema = strawberry.Schema(query=AnnotationQuery, config=StrawberryConfig(auto_camel_case=True))

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
  
  graphql_app = GraphQLRouter(schema)
  app.include_router(graphql_app, prefix="/graphql")

  return app