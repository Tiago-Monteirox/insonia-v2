from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    """Classe base para todos os modelos SQLAlchemy do projeto."""


async def get_db() -> AsyncSession:
    """Dependency do FastAPI que fornece uma sessão assíncrona por request."""
    async with AsyncSessionLocal() as session:
        yield session