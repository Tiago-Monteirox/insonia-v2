# Testing Patterns

**Analysis Date:** 2026-04-26

## Test Framework

**Runner:**

- `pytest` — referenced in `IMPL_GUIDE.md` as the prescribed framework; not yet installed in `pyproject.toml` (no `[dependency-groups]` dev entry for pytest)
- Async support via `pytest-asyncio`
- HTTP client via `httpx` with `ASGITransport` for in-process FastAPI testing

**Assertion Library:**

- `pytest` built-in assertions

**Run Commands:**

```bash
uv run pytest                        # Run all tests
uv run pytest -v                     # Verbose output
uv run pytest tests/test_stock.py    # Run specific file
uv run pytest --cov=app              # Coverage (requires pytest-cov)
```

**Status:** Tests directory exists at `tests/` but is currently empty. No test files, no `conftest.py`. The patterns below reflect the prescribed approach documented in `IMPL_GUIDE.md` (Phase 8), not yet implemented.

## Required Test Dependencies

These are specified in `IMPL_GUIDE.md` but not in `pyproject.toml`:

```bash
uv add --dev pytest pytest-asyncio httpx
```

Once added, they should appear under `[dependency-groups] dev` in `pyproject.toml`.

## Test File Organization

**Location:**

- Separate `tests/` directory at project root (not co-located with source)

**Naming:**

- `test_{module}.py` pattern: `tests/test_stock.py`, `tests/test_sale.py`

**Structure:**

```
tests/
├── conftest.py       # Fixtures: db engine, session, AsyncClient
├── test_stock.py     # Unit tests for app/services/stock.py
├── test_sale.py      # Unit tests for app/services/sale.py
└── test_graphql.py   # Integration tests via HTTP client
```

## Prescribed conftest.py Pattern

The canonical `conftest.py` from `IMPL_GUIDE.md`:

```python
# tests/conftest.py
import asyncio
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "postgresql+asyncpg://insonia:insonia@localhost:5432/insonia_test"

engine_test = create_async_engine(TEST_DATABASE_URL)
TestSessionLocal = async_sessionmaker(engine_test, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    """Cria todas as tabelas antes dos testes e derruba ao final da sessão."""
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db():
    """Fornece uma sessão de banco de dados de teste para cada teste."""
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client(db):
    """Fornece AsyncClient com dependência de banco substituída pelo banco de teste."""
    app.dependency_overrides[get_db] = lambda: db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
```

**Key characteristics:**

- `setup_db` is session-scoped and `autouse=True` — runs once for all tests
- Uses a separate `insonia_test` database, NOT the development database
- `db` fixture yields a real `AsyncSession` against the test DB
- `client` fixture uses FastAPI's `dependency_overrides` to inject the test DB session
- `dependency_overrides.clear()` is called in teardown to prevent fixture leakage

## Test Structure

**Suite Organization:**

```python
# Each test function is an async coroutine
@pytest.mark.asyncio
async def test_insufficient_stock(db, product_fixture):
    """Garante que check_stock levanta 400 quando a quantidade excede o estoque."""
    with pytest.raises(HTTPException) as exc:
        await check_stock(db, product_fixture.id, quantity=9999)
    assert exc.value.status_code == 400
```

**Patterns:**

- All test functions are `async def` and decorated with `@pytest.mark.asyncio`
- Test names follow `test_{what_is_being_tested}` convention
- Docstrings describe the assertion being made (in Portuguese)
- Service layer tests receive `db` fixture directly (no HTTP layer)
- Integration tests receive `client` fixture for full stack testing

## Mocking

**Framework:** Not yet used. No `unittest.mock` or `pytest-mock` imports observed.

**Prescribed approach:**

- Prefer dependency injection via `app.dependency_overrides` over patching
- Use the real test database for service and integration tests (no DB mocking)

**What to mock:**

- External services that are not available in the test environment
- Filesystem operations (image uploads, if implemented)

**What NOT to mock:**

- The database session — use the real test DB via `db` fixture
- SQLAlchemy ORM — test against actual queries
- FastAPI app — use `ASGITransport` for in-process testing without a real server

## Database Testing

**Approach:**

- Real PostgreSQL test database (`insonia_test`) — not SQLite or in-memory
- Tables created via `Base.metadata.create_all` at session start
- Tables dropped via `Base.metadata.drop_all` at session end
- Test DB URL: `postgresql+asyncpg://insonia:insonia@localhost:5432/insonia_test`

**Transaction isolation:**

- Current prescribed pattern does NOT wrap each test in a rolled-back transaction
- Tests that mutate data will affect subsequent tests in the session unless fixtures clean up

## Fixtures

**Prescribed fixtures in `conftest.py`:**

- `setup_db` — session-scoped, creates/drops schema
- `db` — function-scoped, yields `AsyncSession`
- `client` — function-scoped, yields `httpx.AsyncClient` with injected test DB

**Domain fixtures (to be added per module):**

- `product_fixture` — referenced in example test but not yet defined
- Should create and return ORM instances using the `db` fixture

Example pattern for domain fixtures:

```python
@pytest_asyncio.fixture
async def product_fixture(db):
    product = Product(name="Test", sale_price=Decimal("10.00"), cost_price=Decimal("5.00"))
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product
```

## Test Types

**Unit Tests (service layer):**

- Scope: `app/services/stock.py` and `app/services/sale.py`
- Receive `db` fixture directly
- Test business logic: stock validation, atomic sale creation, stock restoration on delete
- Example: `test_insufficient_stock`, `test_create_sale_decrements_stock`

**Integration Tests (GraphQL API):**

- Scope: `app/graphql/` resolvers via HTTP
- Receive `client` fixture
- Test full request/response cycle through GraphQL endpoint at `/graphql`
- Use `client.post("/graphql", json={"query": "..."})` pattern

**E2E Tests:**

- Not prescribed — no separate E2E framework mentioned

## Coverage

**Requirements:** None enforced (no `pytest-cov` in dependencies, no coverage threshold configured)

**View Coverage:**

```bash
uv run pytest --cov=app --cov-report=term-missing
```

## Async Considerations

- All application code is `async` — tests must be `async def` with `@pytest.mark.asyncio`
- `pytest-asyncio` is required for async test support
- Do not use `asyncio.run()` inside tests — let `pytest-asyncio` manage the event loop
- Session-scoped fixtures with `autouse=True` are used for expensive setup (DB schema creation)

---

*Testing analysis: 2026-04-26*
