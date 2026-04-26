# Codebase Structure

**Analysis Date:** 2026-04-26

## Directory Layout

```
insonia-v2/
├── app/                        # Python application package
│   ├── core/                   # Infrastructure: DB, auth, config
│   │   ├── auth.py             # fastapi-users wiring, JWT strategy
│   │   ├── config.py           # Typed env-var reads (python-decouple)
│   │   └── database.py         # Async engine, Base class, get_db dep
│   ├── graphql/                # Strawberry GraphQL layer
│   │   ├── schema.py           # Schema assembly + context_getter
│   │   ├── queries.py          # Query root + ORM-to-type converters
│   │   ├── mutations.py        # Mutation root
│   │   ├── types.py            # Strawberry output types
│   │   └── inputs.py           # Strawberry input types
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── __init__.py         # Barrel: re-exports all model classes
│   │   ├── mixins.py           # SlugMixin (auto-slug on insert/update)
│   │   ├── user.py             # User (extends fastapi-users base)
│   │   ├── product.py          # Product + ProductImage
│   │   ├── sale.py             # Sale + SaleItem
│   │   ├── variation.py        # VariationName, VariationValue, Variation
│   │   ├── brand.py            # Brand
│   │   └── category.py         # Category
│   ├── routers/                # REST routers (empty — reserved)
│   │   └── __init__.py
│   ├── schemas/                # Pydantic schemas for REST auth routes
│   │   └── user.py             # UserRead, UserCreate, UserUpdate
│   ├── services/               # Business logic / transactional operations
│   │   ├── sale.py             # create_sale, remove_sale, ItemInput
│   │   └── stock.py            # check_stock, decrement_stock, increment_stock
│   ├── __init__.py
│   └── main.py                 # FastAPI app factory, router registration
├── migrations/                 # Alembic schema migrations
│   ├── env.py                  # Async migration runner, imports Base.metadata
│   ├── script.py.mako          # Migration file template
│   └── versions/               # Individual migration scripts
│       ├── 37d9af481f87_initial.py         # All domain tables
│       └── c57cdf359e3d_add_users_table.py # Users table
├── insonia-frontend/           # Frontend design assets (not a build system)
│   ├── SKILL.md                # insonia-design skill definition
│   ├── README.md               # Design system documentation
│   ├── colors_and_type.css     # CSS variables (colors, type, spacing)
│   ├── ui_kits/                # Reference UI kit HTML files
│   │   ├── insonia_app/        # App screens (Sidebar, PDV, Produtos, …)
│   │   └── insonia_store/      # Store-facing screens
│   ├── assets/                 # Logo and brand assets
│   ├── preview/                # Design token preview cards
│   └── uploads/                # Image uploads (design mockups)
├── tests/                      # Test directory (currently empty)
├── .planning/                  # GSD planning artifacts
│   └── codebase/               # Codebase map documents
├── .claude/                    # Claude settings
│   └── settings.local.json
├── main.py                     # Root entry point (prints hello — not the server)
├── alembic.ini                 # Alembic configuration
├── docker-compose.yml          # PostgreSQL 16 dev database
├── pyproject.toml              # Project metadata + dependencies (uv)
├── uv.lock                     # Locked dependency tree
├── .python-version             # Python version pin (3.12)
├── .env                        # Environment variables (not committed)
├── .gitignore
├── .pre-commit-config.yaml     # Pre-commit hooks
├── README.md                   # Project readme
├── ROADMAP.md                  # Development roadmap
└── IMPL_GUIDE.md               # Implementation guide
```

## Directory Purposes

**`app/core/`:**

- Purpose: Cross-cutting infrastructure shared by all layers
- Contains: Database session factory, authentication backend, typed configuration
- Key files: `app/core/database.py` (Base class, get_db), `app/core/auth.py` (current_active_user), `app/core/config.py`

**`app/graphql/`:**

- Purpose: Full GraphQL API surface (all domain CRUD except user auth)
- Contains: Strawberry schema, Query/Mutation roots, output types, input types
- Key files: `app/graphql/schema.py` (mount point), `app/graphql/queries.py`, `app/graphql/mutations.py`

**`app/models/`:**

- Purpose: SQLAlchemy table definitions — source of truth for DB schema
- Contains: One file per domain entity, plus `mixins.py` for shared behaviors
- Key files: `app/models/__init__.py` (barrel export used by migrations), `app/models/mixins.py`

**`app/schemas/`:**

- Purpose: Pydantic schemas for the REST auth routes (fastapi-users only)
- Contains: `UserRead`, `UserCreate`, `UserUpdate`
- Note: GraphQL layer uses Strawberry types instead of Pydantic schemas

**`app/services/`:**

- Purpose: Stateless async functions encapsulating multi-step business operations
- Contains: Sale lifecycle (create + remove with stock sync), stock CRUD helpers
- Key files: `app/services/sale.py`, `app/services/stock.py`

**`app/routers/`:**

- Purpose: Reserved for future REST domain routers
- Contains: Empty `__init__.py` only — no active routers

**`migrations/versions/`:**

- Purpose: Ordered Alembic migration scripts; each maps to a schema change
- Generated: Yes — produced by `alembic revision --autogenerate`
- Committed: Yes

**`insonia-frontend/`:**

- Purpose: Design system assets and UI kit reference (not compiled by a build tool)
- Contains: Static HTML UI kits, CSS variables, brand assets, SKILL.md for the insonia-design agent skill
- Note: No JavaScript framework; frontend app is not in this repository

## Key File Locations

**Entry Points:**

- `app/main.py`: FastAPI application factory — this is what uvicorn serves (`uvicorn app.main:app`)
- `main.py` (root): Placeholder script, not the server

**Configuration:**

- `app/core/config.py`: All typed env-var reads — add new config here
- `.env`: Runtime secrets (DATABASE_URL, SECRET_KEY, DEBUG, JWT_LIFETIME_SECONDS, MAX_IMAGE_SIZE_MB)
- `alembic.ini`: Alembic tool configuration

**Core Logic:**

- `app/services/sale.py`: Only file with transactional business rules
- `app/graphql/mutations.py`: All write operations exposed over the API
- `app/graphql/queries.py`: All read operations + ORM-to-type converter functions

**Models:**

- `app/models/__init__.py`: Import all models here so Alembic picks them up via `Base.metadata`

**Testing:**

- `tests/`: Empty — no tests exist yet

## Naming Conventions

**Files:**

- Snake_case for all Python files: `sale.py`, `stock.py`, `mixins.py`
- Domain noun as filename: one model class per file (except `sale.py` has `Sale` + `SaleItem`, `product.py` has `Product` + `ProductImage`)

**Directories:**

- Lowercase plural nouns: `models/`, `services/`, `schemas/`, `routers/`

**Classes:**

- PascalCase: `Product`, `SaleItem`, `VariationName`, `UserManager`
- SQLAlchemy models use English class names even though DB table names are Portuguese (e.g., class `Product` → table `"produtos"`)

**Functions:**

- Snake_case: `create_sale`, `check_stock`, `product_model_to_type`
- Async functions prefixed or suffixed with domain verb: `create_sale`, `remove_sale`, `decrement_stock`

**Database tables:**

- Portuguese nouns: `produtos`, `vendas`, `itens_venda`, `marcas`, `categorias`, `variacoes`, `nome_variacoes`, `valor_variacoes`, `produto_imagens`, `users`

**GraphQL types:**

- Suffix `Type` for output types: `ProductType`, `SaleType`, `MoneyType`
- Suffix `Input` for input types: `ProductInput`, `CategoryInput`, `BrandInput`, `SaleItemInput`
- Suffix `Result` for mutation-specific return types: `SaleResult`

## Where to Add New Code

**New domain entity (e.g., Supplier):**

- Model: `app/models/supplier.py` — new `SQLAlchemy` mapped class extending `Base`
- Register in barrel: add import to `app/models/__init__.py`
- GraphQL type: add `SupplierType` in `app/graphql/types.py`
- GraphQL input: add `SupplierInput` in `app/graphql/inputs.py`
- Resolver methods: add to `app/graphql/queries.py` (Query class) and `app/graphql/mutations.py` (Mutation class)
- Migration: run `alembic revision --autogenerate -m "add_suppliers_table"` — new file in `migrations/versions/`

**New service / business rule:**

- Implementation: new file in `app/services/` (e.g., `app/services/pricing.py`)
- Keep services stateless async functions receiving `AsyncSession` as first argument

**New REST endpoint (non-auth):**

- Router: new file in `app/routers/` (e.g., `app/routers/products.py`) using `APIRouter`
- Register: `app.include_router(...)` in `app/main.py`

**New configuration variable:**

- Add typed read in `app/core/config.py` using `config("VAR_NAME", default=..., cast=...)`
- Document in `.env` (example value)

**New GraphQL ORM-to-type converter:**

- Add as a module-level function in `app/graphql/queries.py` alongside `product_model_to_type` and `sale_model_to_type`
- Import and reuse in `app/graphql/mutations.py` when the mutation must return the same type

## Special Directories

**`.planning/`:**

- Purpose: GSD planning documents and codebase maps
- Generated: Yes — by GSD commands
- Committed: Yes

**`.venv/`:**

- Purpose: Python virtual environment managed by uv
- Generated: Yes
- Committed: No

**`__pycache__/`:**

- Purpose: Python bytecode cache
- Generated: Yes
- Committed: No

**`insonia-frontend/ui_kits/`:**

- Purpose: Reference HTML screens for the design system
- Generated: No — hand-authored design artifacts
- Committed: Yes

---

*Structure analysis: 2026-04-26*
