# Coding Conventions

**Analysis Date:** 2026-04-26

## Naming Patterns

**Files:**

- Python modules use `snake_case`: `sale.py`, `stock.py`, `mixins.py`
- GraphQL layer splits into purpose-named files: `types.py`, `inputs.py`, `queries.py`, `mutations.py`, `schema.py`
- One model class per file (exception: related pairs like `Product`/`ProductImage`, `Sale`/`SaleItem`)

**Classes:**

- `PascalCase` for all classes: `Product`, `SaleItem`, `ProductInput`, `CategoryType`, `UserManager`
- SQLAlchemy models do NOT include `Model` suffix: `Product` not `ProductModel`
- Strawberry GraphQL types use `Type` suffix: `ProductType`, `CategoryType`, `MoneyType`
- Strawberry GraphQL inputs use `Input` suffix: `ProductInput`, `CategoryInput`, `BrandInput`
- Strawberry GraphQL result types use `Result` suffix: `SaleResult`

**Functions:**

- `snake_case` for all functions: `create_sale`, `check_stock`, `product_model_to_type`
- Converter functions follow `{model}_model_to_type` pattern: `product_model_to_type`, `sale_model_to_type` (`app/graphql/queries.py`)
- Service functions named after their operation: `create_sale`, `remove_sale`, `check_stock`, `decrement_stock`, `increment_stock`
- FastAPI dependency functions named with `get_` prefix: `get_db`, `get_user_db`, `get_user_manager`, `get_jwt_strategy`, `get_context`

**Variables:**

- `snake_case` throughout
- Short single-letter variables allowed only in tight loops/comprehensions: `p` for product, `s` for sale, `r` for row, `c` for category
- DB session always named `db`: `db = info.context["db"]`
- ORM query result always named `result`: `result = await db.execute(...)`

**Constants:**

- `UPPER_SNAKE_CASE` for module-level config constants: `DATABASE_URL`, `SECRET_KEY`, `JWT_LIFETIME_SECONDS` (`app/core/config.py`)

**Database table names:**

- Portuguese, plural: `"produtos"`, `"categorias"`, `"marcas"`, `"vendas"`, `"itens_venda"`, `"nome_variacoes"`, `"valor_variacoes"`, `"variacoes"`
- Python model names remain English: `Product`, `Category`, `Brand`, `Sale`

## Code Style

**Formatter:**

- `black` v25.1.0 — enforced via pre-commit hook (`.pre-commit-config.yaml`)
- Line length: 88 characters (black default)

**Linting:**

- `flake8` v7.2.0 with `--max-line-length=88 --ignore=W503,E203`
- `flake8-print` plugin installed — `print()` calls are a lint error (use `# noqa` only if absolutely necessary; only one instance exists: `main.py:3`)
- `autoflake` removes unused imports and unused variables automatically

**Import sorting:**

- `isort` v5.13.2 with `--profile black`

**Pylint:**

- `no-member` disabled in `pyproject.toml` (due to SQLAlchemy dynamic attributes)

## Import Organization

**Order (enforced by isort profile=black):**

1. Standard library: `from decimal import Decimal`, `from datetime import datetime`, `from dataclasses import dataclass`
2. Third-party: `import strawberry`, `from fastapi import ...`, `from sqlalchemy import ...`
3. Internal (absolute paths, `app.*` prefix): `from app.core.database import Base`, `from app.graphql.types import ProductType`

**Path aliases:**

- None — all internal imports use full absolute paths from project root: `from app.models.product import Product`

**Barrel imports:**

- `app/models/__init__.py` re-exports all model classes with explicit `__all__`
- Other packages (`app/graphql/`, `app/services/`, `app/core/`) have empty `__init__.py` — import directly from module files

**Inline imports:**

- Avoid in general; one known exception in `app/services/sale.py:64` where `from fastapi import HTTPException` is deferred inside a conditional block (considered tech debt)
- Another in `app/graphql/mutations.py:47-48` inside an async function body

## Type Annotations

**Style:**

- Python 3.10+ union syntax (`X | None`) is preferred over `Optional[X]`
- One inconsistency: `app/graphql/queries.py` uses `from typing import Optional` for one function (`Optional[ProductType]`) while the rest of the file uses `X | None`
- All function signatures include full return type annotations
- SQLAlchemy columns use `Mapped[type]` with `mapped_column()` — no legacy `Column()` usage

**Decimal vs float:**

- Internal data layer uses `Decimal` throughout (models, services, `ItemInput` dataclass)
- GraphQL boundary converts to `float` on the way out: `float(p.sale_price)` in `product_model_to_type`
- GraphQL inputs accept `float` and convert to `Decimal(str(input.sale_price))` on the way in (mutations)
- Never perform arithmetic on raw `float` for money — use `Decimal`

## Docstrings

**Coverage:**

- All non-trivial classes have a single-line docstring in Portuguese
- All non-trivial functions have a single-line docstring in Portuguese
- `__init__.py` files and trivially empty stubs have no docstring

**Format:**

- Single-line triple-quoted strings: `"""Cria uma venda atomicamente: verifica estoque, decrementa e persiste os itens."""`
- No multi-line Google/NumPy style blocks — keep it brief and descriptive
- Parameters and return values are NOT documented in docstrings (type hints serve that role)

**Language:**

- Docstrings are written in Portuguese
- Error `detail` strings are a mix: English for stock errors (`"Product not found"`, `"Insufficient stock"`) and Portuguese for sale errors (`"Venda não encontrada"`)

## Comments

**Inline comments:**

- Used sparingly to explain non-obvious decisions
- Always in Portuguese: `# flush para obter sale.id sem commitar`, `# Preços como Numeric — armazena centavos com precisão`
- Security rationale: `# Buscar preços do banco para não confiar no cliente`
- Section dividers in large files use `# --- SectionName ---` pattern: `# --- Produto ---`, `# --- Categoria ---` in `app/graphql/mutations.py`

## Error Handling

**Strategy:**

- Services raise `fastapi.HTTPException` directly — no custom exception hierarchy
- `check_stock` raises `404` if product not found, `400` if stock is insufficient (`app/services/stock.py`)
- `remove_sale` raises `404` if sale not found (`app/services/sale.py`)
- GraphQL mutations do NOT catch exceptions — they propagate upward to Strawberry/FastAPI

**Patterns:**

- Use `scalar_one_or_none()` when a missing record is a valid state (returns `None`)
- Use `scalar_one()` when the record must exist — raises `sqlalchemy.exc.NoResultFound` on miss (no explicit guard in mutations, which is a concern)
- No `try/except` blocks exist anywhere in the codebase — all errors surface as unhandled exceptions or HTTPException raises

## Module Design

**Service layer (`app/services/`):**

- Plain async functions, no classes
- Takes `AsyncSession` as first argument (dependency-injected by caller)
- Uses `async with db.begin()` for atomic multi-step operations (`create_sale`, `remove_sale`)
- Returns ORM model instances to callers

**GraphQL resolvers (`app/graphql/`):**

- Resolver methods live on `Query`/`Mutation` Strawberry classes
- Context provides `db` (AsyncSession) and `user` (authenticated User)
- Resolvers call service functions for business logic, or execute queries inline for simple reads
- Converter functions (`product_model_to_type`, `sale_model_to_type`) isolate ORM-to-GraphQL mapping

**Models (`app/models/`):**

- Pure SQLAlchemy declarative models — no business logic
- Use `Mapped[T]` + `mapped_column()` for all columns (SQLAlchemy 2.0 style)
- Mixin pattern for shared behavior: `SlugMixin` in `app/models/mixins.py`
- Relationships use string forward references for cross-model: `Mapped["ProductImage"]`

**Configuration (`app/core/config.py`):**

- All env vars read once at module import time using `python-decouple`
- Module-level constants exported for use elsewhere — never import `config()` outside this file

---

*Convention analysis: 2026-04-26*
