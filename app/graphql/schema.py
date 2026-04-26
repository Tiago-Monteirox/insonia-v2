import strawberry
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.fastapi import GraphQLRouter

from app.core.database import get_db
from app.graphql.mutations import Mutation
from app.graphql.queries import Query


async def get_context(db: AsyncSession = Depends(get_db)) -> dict:
    """Monta o contexto injetado em cada resolver GraphQL."""
    return {"db": db}


schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(schema, context_getter=get_context)
