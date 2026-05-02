import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.database import Base, get_db
from app.main import app
from app.models.product import Product
from app.models.user import User

TEST_DATABASE_URL = "postgresql+asyncpg://insonia:insonia@localhost:5432/insonia_test"

# NullPool evita reutilizar conexões asyncpg entre event loops distintos
# (pytest-asyncio cria um event loop por teste com asyncio_default_fixture_loop_scope=function)
engine_test = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(engine_test, expire_on_commit=False)


@pytest_asyncio.fixture(autouse=True)
async def setup_and_clean_db():
    """Garante as tabelas antes do teste e trunca os dados após."""
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine_test.begin() as conn:
        table_names = ", ".join(
            f'"{t.name}"' for t in reversed(Base.metadata.sorted_tables)
        )
        await conn.execute(text(f"TRUNCATE {table_names} RESTART IDENTITY CASCADE"))


@pytest_asyncio.fixture
async def db() -> AsyncSession:
    """Sessão de banco isolada por teste."""
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def product(db: AsyncSession) -> Product:
    """Produto de teste com estoque inicial = 10."""
    p = Product(
        name="Produto Teste",
        sale_price="50.00",
        cost_price="20.00",
        stock=10,
        currency="BRL",
    )
    db.add(p)
    await db.commit()
    await db.refresh(p)
    # segundo commit fecha a transação implícita aberta pelo refresh;
    # garante que a sessão esteja limpa antes de chamar db.begin() nos serviços
    await db.commit()
    return p


@pytest_asyncio.fixture
async def user(db: AsyncSession) -> User:
    """Usuário superuser de teste."""
    from fastapi_users.password import PasswordHelper

    helper = PasswordHelper()
    u = User(
        email="teste@insonia.com",
        username="testusr",
        hashed_password=helper.hash("senha123"),
        is_active=True,
        is_superuser=True,
        is_verified=True,
    )
    db.add(u)
    await db.commit()
    await db.refresh(u)
    await db.commit()
    return u


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    """AsyncClient sem autenticação; cada request usa sessão própria."""

    async def override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_client(db: AsyncSession, user: User) -> AsyncClient:
    """AsyncClient com superuser autenticado via JWT; cada request usa sessão própria."""
    from app.core.auth import get_jwt_strategy

    strategy = get_jwt_strategy()
    token = await strategy.write_token(user)

    async def override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as c:
        yield c
    app.dependency_overrides.clear()
