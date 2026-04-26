<!-- refreshed: 2026-04-26 -->
# Architecture

**Analysis Date:** 2026-04-26

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                          HTTP Clients                                │
│               (Browser, Mobile App, PDV Terminal)                   │
└──────────────────┬───────────────────────────┬───────────────────────┘
                   │                           │
                   ▼                           ▼
┌──────────────────────────┐   ┌───────────────────────────────────────┐
│   REST Auth Endpoints    │   │         GraphQL Endpoint              │
│  /auth/*  /users/*       │   │           /graphql                    │
│  `app/main.py`           │   │   `app/graphql/schema.py`             │
│  fastapi-users generated │   │   `app/graphql/queries.py`            │
│                          │   │   `app/graphql/mutations.py`          │
└──────────┬───────────────┘   └──────────────┬────────────────────────┘
           │                                  │
           ▼                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Core / Infrastructure                        │
│   Auth: `app/core/auth.py`       Config: `app/core/config.py`        │
│   DB session: `app/core/database.py`                                 │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Service Layer                                 │
│   `app/services/sale.py`   `app/services/stock.py`                  │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Model Layer (ORM)                            │
│  `app/models/user.py`     `app/models/product.py`                   │
│  `app/models/sale.py`     `app/models/variation.py`                 │
│  `app/models/brand.py`    `app/models/category.py`                  │
│  `app/models/mixins.py`                                              │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     PostgreSQL (via asyncpg)                         │
│                   Tables: Portuguese names                           │
│    vendas, itens_venda, produtos, marcas, categorias, users, …       │
└──────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| FastAPI app | Router registration, lifespan, health check | `app/main.py` |
| Auth core | JWT strategy, fastapi-users wiring, `current_active_user` dependency | `app/core/auth.py` |
| Database core | Async engine, `Base` ORM class, `get_db` dependency | `app/core/database.py` |
| Config core | Typed env-var reads via python-decouple | `app/core/config.py` |
| GraphQL schema | Strawberry schema assembly, context injection (db + user) | `app/graphql/schema.py` |
| GraphQL queries | `Query` root — all read resolvers, ORM-to-type converters | `app/graphql/queries.py` |
| GraphQL mutations | `Mutation` root — create/update/delete resolvers | `app/graphql/mutations.py` |
| GraphQL types | Strawberry output types (ProductType, SaleType, MoneyType, …) | `app/graphql/types.py` |
| GraphQL inputs | Strawberry input types (ProductInput, CategoryInput, BrandInput) | `app/graphql/inputs.py` |
| Sale service | Atomic sale creation (stock check → decrement → persist) and removal | `app/services/sale.py` |
| Stock service | Low-level stock check, decrement, increment operations | `app/services/stock.py` |
| User model | SQLAlchemy User table extending fastapi-users base | `app/models/user.py` |
| Product model | Products + images, SlugMixin auto-slug | `app/models/product.py` |
| Sale model | Sale header + SaleItem line rows | `app/models/sale.py` |
| Variation models | VariationName → VariationValue → Variation (product↔value join) | `app/models/variation.py` |
| Brand model | Brands with SlugMixin | `app/models/brand.py` |
| Category model | Categories with SlugMixin | `app/models/category.py` |
| SlugMixin | SQLAlchemy event listeners that auto-generate slug on insert/update | `app/models/mixins.py` |
| User schemas | Pydantic/fastapi-users schemas for read/create/update | `app/schemas/user.py` |
| Alembic migrations | DB schema evolution | `migrations/versions/` |

## Pattern Overview

**Overall:** Layered FastAPI application with a GraphQL-first API surface

**Key Characteristics:**

- Dual API surface: REST only for authentication (fastapi-users), GraphQL (Strawberry) for all domain data
- Async throughout: `AsyncSession`, `create_async_engine`, `asyncpg` driver
- Authentication is JWT Bearer injected into every GraphQL context — all resolvers require a valid user
- Services encapsulate multi-step business transactions (sale creation is atomic via `db.begin()`)
- ORM models are pure SQLAlchemy 2.x mapped classes with no business logic, except `SlugMixin` event hooks

## Layers

**Infrastructure (Core):**

- Purpose: Database connection, configuration, authentication wiring
- Location: `app/core/`
- Contains: Engine creation, `Base` class, JWT strategy, env-var loading
- Depends on: `sqlalchemy`, `fastapi-users`, `python-decouple`
- Used by: All other layers

**Model Layer:**

- Purpose: SQLAlchemy ORM table definitions — pure data structure, no business logic
- Location: `app/models/`
- Contains: Mapped classes, FK relationships, constraints, `SlugMixin`
- Depends on: `app/core/database.py` (Base)
- Used by: Services, GraphQL resolvers

**Service Layer:**

- Purpose: Multi-step transactional business logic
- Location: `app/services/`
- Contains: `create_sale`, `remove_sale`, `check_stock`, `decrement_stock`, `increment_stock`
- Depends on: `app/models/`, `app/core/database.py`
- Used by: GraphQL mutations

**GraphQL Layer:**

- Purpose: API contract definition and resolver implementation
- Location: `app/graphql/`
- Contains: Strawberry types, input types, `Query` root, `Mutation` root, context getter
- Depends on: `app/services/`, `app/models/`, `app/core/auth.py`
- Used by: `app/main.py` (mounted as `GraphQLRouter`)

**Schema Layer (Pydantic):**

- Purpose: REST input/output validation for fastapi-users auth routes only
- Location: `app/schemas/`
- Contains: `UserRead`, `UserCreate`, `UserUpdate`
- Depends on: `fastapi-users`
- Used by: `app/main.py`

**Migrations:**

- Purpose: Declarative DB schema versioning
- Location: `migrations/`
- Contains: Alembic env.py + version files
- Depends on: `app/core/database.py` (Base.metadata), `app/models/`

## Data Flow

### GraphQL Mutation — Create Sale

1. Client sends `POST /graphql` with `createSale(items: [...])` and `Authorization: Bearer <token>` header
2. `app/graphql/schema.py:get_context` — resolves `get_db` (yields `AsyncSession`) and `current_active_user` (validates JWT, returns `User`)
3. `app/graphql/mutations.py:Mutation.create_sale` — for each item, fetches current prices from DB (never trusts client-supplied prices)
4. `app/services/sale.py:create_sale` — opens `db.begin()` transaction: calls `check_stock` for all items, then `decrement_stock` per item, creates `Sale` + `SaleItem` rows, computes totals
5. Mutation returns `SaleResult` with `id`, `total_amount`, `total_profit`

### GraphQL Query — All Products

1. Client sends `POST /graphql` with `allProducts` query
2. `get_context` — same JWT check; `AsyncSession` injected
3. `app/graphql/queries.py:Query.all_products` — executes `select(Product)` via session
4. Each ORM row converted to `ProductType` via `product_model_to_type` (inline converter function)
5. Strawberry serializes to JSON response

### REST Auth — Login

1. Client sends `POST /auth/login` with email + password
2. fastapi-users `AuthenticationBackend` verifies credentials via `UserManager`
3. `JWTStrategy` issues a signed token (lifetime from `JWT_LIFETIME_SECONDS` env var)
4. Token returned to client as `{"access_token": "...", "token_type": "bearer"}`

**State Management:**

- No in-process state. Each request receives a fresh `AsyncSession` via `get_db` dependency.
- All mutable state lives in PostgreSQL.

## Key Abstractions

**`SlugMixin` (`app/models/mixins.py`):**

- Purpose: Auto-generate URL slugs from `name` field on insert and update
- Examples: `app/models/product.py`, `app/models/brand.py`, `app/models/category.py`
- Pattern: `__init_subclass__` registers SQLAlchemy `before_insert` / `before_update` event listeners; slug is only set when `name` is present and `slug` is blank

**`ItemInput` dataclass (`app/services/sale.py`):**

- Purpose: Internal DTO carrying product_id, quantity, and server-fetched prices into `create_sale`
- Pattern: Dataclass — not a Pydantic model, not a SQLAlchemy model; exists only to move data between mutation resolver and service

**`MoneyType` (`app/graphql/types.py`):**

- Purpose: GraphQL representation of a monetary value with explicit currency
- Pattern: Prices stored as `Numeric(14,2)` in DB; converted to `MoneyType(amount, currency)` at the resolver boundary

**`get_context` (`app/graphql/schema.py`):**

- Purpose: Single point where DB session and authenticated user are injected into every GraphQL resolver via `info.context`
- Pattern: FastAPI `Depends` used inside Strawberry `context_getter`; all resolvers access `info.context["db"]` and `info.context["user"]`

**ORM-to-Type converters (`app/graphql/queries.py`):**

- Purpose: Map ORM model instances to Strawberry output types
- Examples: `product_model_to_type`, `sale_model_to_type`
- Pattern: Module-level functions (not class methods); reused by mutations that need to return the same type after a write

## Entry Points

**Application bootstrap:**

- Location: `app/main.py`
- Triggers: `uvicorn app.main:app`
- Responsibilities: Creates `FastAPI` instance, registers REST routers (auth, users) and GraphQL router

**Root script (`main.py`):**

- Location: `main.py` (project root)
- Triggers: `python main.py`
- Responsibilities: Prints hello message only — not the actual server entry point

**Migrations:**

- Location: `migrations/env.py`
- Triggers: `alembic upgrade head`
- Responsibilities: Applies schema migrations using async engine and `Base.metadata`

## Architectural Constraints

- **Threading:** Single-threaded async event loop (uvicorn + asyncio). No worker threads — all I/O is `await`-based.
- **Global state:** `engine` and `AsyncSessionLocal` are module-level singletons in `app/core/database.py`. `auth_backend` and `fastapi_users` are module-level singletons in `app/core/auth.py`.
- **Circular imports:** `app/graphql/mutations.py` imports `fastapi.HTTPException` from inside `app/services/sale.py` at function scope (lazy import) to avoid a circular dependency between service and HTTP layers.
- **Auth scope:** All GraphQL resolvers (queries and mutations) require authentication. `get_context` calls `current_active_user` unconditionally — there are no public GraphQL endpoints.
- **Price trust:** Sale mutations explicitly re-fetch product prices from the database; they never accept price values from the GraphQL client input.

## Anti-Patterns

### Direct DB access in mutation resolvers

**What happens:** `app/graphql/mutations.py:create_sale` executes a `select(Product)` loop inline before calling the service, rather than passing product IDs and letting the service own all DB access.
**Why it's wrong:** Business logic (price fetching) is split across the resolver and the service; the service's `ItemInput` dataclass implies the service should receive enriched data, but the resolver is the one enriching it.
**Do this instead:** Move the product price lookup into `app/services/sale.py:create_sale` (accept only `product_id` + `quantity`), keeping the mutation resolver a thin translation layer.

### `routers/` directory exists but is empty

**What happens:** `app/routers/` contains only an empty `__init__.py` with no router modules.
**Why it's wrong:** Suggests REST routers were planned but not implemented; creates navigational confusion.
**Do this instead:** Either add domain routers here or remove the directory until it is needed.

## Error Handling

**Strategy:** Raise `fastapi.HTTPException` directly from service functions; Strawberry surfaces HTTP errors naturally.

**Patterns:**

- `app/services/stock.py`: raises `HTTPException(400)` for insufficient stock, `HTTPException(404)` for missing product
- `app/services/sale.py`: raises `HTTPException(404)` for missing sale on removal
- GraphQL mutations use `scalar_one()` (raises `NoResultFound` if row missing) rather than defensive `scalar_one_or_none()` — unhandled ORM exceptions will surface as 500 errors

## Cross-Cutting Concerns

**Logging:** No structured logging configured. `create_async_engine` is initialized with `echo=True` (SQL logging to stdout) — appropriate for development, must be disabled in production.
**Validation:** Input validation handled by Strawberry input types and Pydantic schemas (for REST auth). No custom validators beyond ORM constraints.
**Authentication:** JWT Bearer via fastapi-users. Token validated on every request via `current_active_user` dependency. Token secret and lifetime configured via env vars `SECRET_KEY` and `JWT_LIFETIME_SECONDS`.

---

*Architecture analysis: 2026-04-26*
