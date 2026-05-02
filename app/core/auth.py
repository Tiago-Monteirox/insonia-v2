from fastapi import Depends
from fastapi_users import BaseUserManager, FastAPIUsers, IntegerIDMixin
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import (
    JWT_LIFETIME_SECONDS,
    RESET_PASSWORD_SECRET,
    SECRET_KEY,
    VERIFICATION_SECRET,
)
from app.core.database import get_db
from app.models.user import User


async def get_user_db(session: AsyncSession = Depends(get_db)):
    """Dependency que fornece o adaptador do db para fastapi-users."""
    yield SQLAlchemyUserDatabase(session, User)


class UserManager(IntegerIDMixin, BaseUserManager[User, int]):
    """Gerencia operações de usuário: criação, reset de senha, verificação."""

    reset_password_token_secret = RESET_PASSWORD_SECRET
    verification_token_secret = VERIFICATION_SECRET


async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    """Dependency que fornece o UserManager para o fastapi-users."""
    yield UserManager(user_db)


bearer_transport = BearerTransport(tokenUrl="auth/login")


def get_jwt_strategy() -> JWTStrategy:
    """Retorna a estratégia JWT configurada com chave e tempo de expiração."""
    return JWTStrategy(secret=SECRET_KEY, lifetime_seconds=JWT_LIFETIME_SECONDS)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, int](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)
