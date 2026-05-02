import strawberry
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.fastapi import GraphQLRouter

from app.core.auth import current_active_user
from app.core.database import get_db
from app.graphql.mutations import Mutation
from app.graphql.queries import Query


async def get_context(
    # use_cache=False garante sessão própria para a lógica de negócio,
    # separada da sessão que current_active_user usa internamente.
    # Sem isso, ambos compartilham a mesma sessão (FastAPI cacheia get_db
    # dentro do request) e db.begin() falha com "transaction already begun"
    # porque o SELECT do auth já iniciou uma transação implícita.
    db: AsyncSession = Depends(get_db, use_cache=False),
    user=Depends(current_active_user),
) -> dict:
    """Monta o contexto injetado em cada resolver GraphQL."""
    return {"db": db, "user": user}


schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(schema, context_getter=get_context)
