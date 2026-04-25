from fastapi_users.db import SQLAlchemyBaseUserTable
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(SQLAlchemyBaseUserTable[int], Base):
    """Modelo de usuário com campos extras além do padrão fastapi-users."""

    __tablename__ = "users"

    # SQLAlchemyBaseUserTable já inclui: id, email, hashed_password, is_active, is_superuser, is_verified
    username: Mapped[str] = mapped_column(String(50), unique=True)