from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.auth import auth_backend, fastapi_users
from app.graphql.schema import graphql_app
from app.routers.auth_rate_limit import AuthRateLimitMiddleware
from app.routers.images import router as images_router
from app.schemas.user import UserCreate, UserRead, UserUpdate


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação (startup e shutdown)."""
    yield


app = FastAPI(title="Insonia v2", lifespan=lifespan)

app.add_middleware(AuthRateLimitMiddleware, max_requests=10, window_seconds=60)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5500",  # servidor estático local (python/live-server)
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
app.include_router(graphql_app, prefix="/graphql")
app.include_router(images_router)
app.mount("/media", StaticFiles(directory="media"), name="media")
