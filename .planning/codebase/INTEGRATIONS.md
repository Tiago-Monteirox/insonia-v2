# External Integrations

**Analysis Date:** 2026-04-26

## APIs & External Services

No third-party external API integrations detected (no Stripe, SendGrid, S3, etc.). The application is self-contained with its own database and JWT-based auth.

## Data Storage

**Databases:**

- PostgreSQL 16
  - Connection env var: `DATABASE_URL`
  - Async client: SQLAlchemy 2.x async engine with `asyncpg` driver (`app/core/database.py`)
  - Sync client (migrations only): `psycopg` via Alembic (`migrations/env.py`)
  - Engine configured at: `app/core/database.py` — `create_async_engine(DATABASE_URL, echo=True)`
  - Session factory: `async_sessionmaker` → `AsyncSessionLocal`
  - FastAPI dependency: `get_db()` in `app/core/database.py` — yields `AsyncSession` per request

**File Storage:**

- Local filesystem only — product images stored as file paths in `ProductImage.path` (String 500) column
  - Model: `app/models/product.py` (`ProductImage.__tablename__ = "produto_imagens"`)
  - No cloud storage integration detected
  - `MAX_IMAGE_SIZE_MB` config exists (default 5MB) but upload handling is not yet implemented

**Caching:**

- None detected

## Authentication & Identity

**Auth Provider:**

- Self-hosted via `fastapi-users` library (no external identity provider)
  - Implementation: JWT Bearer Token strategy (`app/core/auth.py`)
  - Transport: `BearerTransport(tokenUrl="auth/login")` — token returned from `POST /auth/login`
  - Strategy: `JWTStrategy` — HS256 signed with `SECRET_KEY`, configurable lifetime via `JWT_LIFETIME_SECONDS`
  - User storage: PostgreSQL `users` table via `SQLAlchemyUserDatabase` adapter
  - User model: `app/models/user.py` — extends `SQLAlchemyBaseUserTable[int]` with `username` field
  - Manager: `UserManager` in `app/core/auth.py` — uses `SECRET_KEY` for password reset and verification tokens
  - Exposed routes (registered in `app/main.py`):
    - `POST /auth/register`
    - `POST /auth/login` (returns JWT)
    - `POST /auth/logout`
    - `GET /users/me`
    - `PATCH /users/me`
  - GraphQL auth: all resolvers require authenticated user via `current_active_user` dependency injected into GraphQL context (`app/graphql/schema.py`)

## Monitoring & Observability

**Error Tracking:**

- None detected (no Sentry, Datadog, etc.)

**Logs:**

- SQLAlchemy engine logging: `echo=True` set in `create_async_engine` — all SQL queries logged to stdout (`app/core/database.py`)
- Alembic logging: configured in `alembic.ini` — root=WARNING, sqlalchemy=WARNING, alembic=INFO
- No structured logging framework configured (no loguru, structlog, etc.)

## CI/CD & Deployment

**Hosting:**

- No production deployment configuration detected (no Dockerfile, Heroku Procfile, fly.toml, render.yaml, etc.)

**CI Pipeline:**

- No CI configuration detected (no `.github/workflows/`, `.gitlab-ci.yml`, etc.)

**Code Quality Gates (local only):**

- pre-commit hooks configured in `.pre-commit-config.yaml`:
  - `check-yaml`, `check-json`, `check-added-large-files`, `end-of-file-fixer`, `debug-statements`, `trailing-whitespace`
  - `autoflake` — removes unused imports/variables
  - `black` 25.1.0 — formatter
  - `isort` 5.13.2 — import sorter
  - `flake8` 7.2.0 — linter (max-line-length=88, flake8-print plugin)
  - `markdownlint-cli` v0.45.0 — markdown linting

## Environment Configuration

**Required env vars:**

- `DATABASE_URL` — PostgreSQL async URL (e.g. `postgresql+asyncpg://insonia:insonia@localhost:5432/insonia`)
- `SECRET_KEY` — secret for JWT signing and token generation

**Optional env vars (have defaults):**

- `DEBUG` — default `False`
- `JWT_LIFETIME_SECONDS` — default `3600` (1 hour)
- `MAX_IMAGE_SIZE_MB` — default `5`

**Secrets location:**

- `.env` file at project root (gitignored via `.gitignore`)
- Loaded via `python-decouple` in `app/core/config.py`

## Webhooks & Callbacks

**Incoming:**

- None

**Outgoing:**

- None

## Database Schema Overview

Tables managed by Alembic migrations (`migrations/versions/`):

| Table | Model | File |
|-------|-------|------|
| `users` | `User` | `app/models/user.py` |
| `produtos` | `Product` | `app/models/product.py` |
| `produto_imagens` | `ProductImage` | `app/models/product.py` |
| `categorias` | `Category` | `app/models/category.py` |
| `marcas` | `Brand` | `app/models/brand.py` |
| `vendas` | `Sale` | `app/models/sale.py` |
| `itens_venda` | `SaleItem` | `app/models/sale.py` |
| `nome_variacoes` | `VariationName` | `app/models/variation.py` |
| `valor_variacoes` | `VariationValue` | `app/models/variation.py` |
| `variacoes` | `Variation` | `app/models/variation.py` |

---

*Integration audit: 2026-04-26*
