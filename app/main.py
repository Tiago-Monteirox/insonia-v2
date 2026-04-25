from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.core.auth import auth_backend, fastapi_users
from app.schemas.user import UserCreate, UserRead, UserUpdate


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação (startup e shutdown)."""
    yield

app = FastAPI(title="Insonia v2", lifespan=lifespan)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


# Rotas geradas automaticamente pelo fastapi-users:
# POST /auth/register
# POST /auth/login  (retorna JWT)
# POST /auth/logout
# GET  /users/me
# PATCH /users/me
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)   