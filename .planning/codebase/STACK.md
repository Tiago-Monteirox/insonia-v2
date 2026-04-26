# Technology Stack

**Analysis Date:** 2026-04-26

## Languages

**Primary:**

- Python 3.12 - All backend application code (`app/`, `migrations/`, `main.py`)

**Secondary:**

- None detected (frontend design assets in `insonia-frontend/` are static mockups/UI kits, no compiled frontend code)

## Runtime

**Environment:**

- CPython 3.12.3

**Package Manager:**

- uv 0.10.5 (`uv.lock` present at project root)
- Lockfile: present (`uv.lock`)

**Virtual Environment:**

- `.venv/` — managed by uv, Python 3.12.3, non-system-site-packages

## Frameworks

**Core:**

- FastAPI >=0.136.1 — ASGI web framework, REST + GraphQL routing (`app/main.py`)
- Strawberry GraphQL >=0.314.3 (with `[fastapi]` extra) — GraphQL schema, queries, mutations (`app/graphql/`)
- fastapi-users >=12.1.3 (with `[sqlalchemy]` extra) — user registration, JWT auth, route generation (`app/core/auth.py`, `app/schemas/user.py`)
- SQLAlchemy >=2.0.49 — async ORM, declarative models, session management (`app/core/database.py`, `app/models/`)
- Pydantic >=2.13.3 — data validation (pulled in by FastAPI and fastapi-users)

**Database Migrations:**

- Alembic >=1.18.4 — async migration runner (`migrations/env.py`, `alembic.ini`)

**ASGI Server:**

- uvicorn >=0.46.0 (with `[standard]` extras) — production/dev ASGI server

**Build/Dev:**

- pre-commit >=4.6.0 — git hooks for code quality
- black 25.1.0 — code formatter
- isort 5.13.2 — import sorter (black-compatible profile)
- flake8 7.2.0 — linter (max-line-length=88, ignores W503 and E203; includes flake8-print plugin)
- autoflake 2.3.1 — removes unused imports and variables
- markdownlint-cli v0.45.0 — markdown linting with auto-fix

## Key Dependencies

**Critical:**

- `fastapi-users[sqlalchemy]` >=12.1.3 — handles entire auth lifecycle: registration, login, JWT strategy, user management, password reset, email verification
- `strawberry-graphql[fastapi]` >=0.314.3 — GraphQL API layer; all data access goes through `/graphql` endpoint
- `sqlalchemy` >=2.0.49 — all DB operations use SQLAlchemy 2.x async API (`create_async_engine`, `async_sessionmaker`, `AsyncSession`)
- `asyncpg` >=0.31.0 — async PostgreSQL driver (used by SQLAlchemy's async engine)
- `psycopg` >=3.3.3 — synchronous PostgreSQL driver (used by Alembic offline migrations)

**Utility:**

- `python-decouple` >=3.8 — loads config from `.env` file (`app/core/config.py`)
- `python-slugify` >=8.0.4 — generates URL slugs for Products, Categories, Brands (`app/models/mixins.py`, `app/graphql/mutations.py`)

## Configuration

**Environment:**

- Configuration loaded via `python-decouple` from `.env` file at project root (`app/core/config.py`)
- Key vars required:
  - `DATABASE_URL` — PostgreSQL async connection string (e.g. `postgresql+asyncpg://...`)
  - `SECRET_KEY` — used for JWT signing and password reset tokens
  - `DEBUG` — boolean, default `False`
  - `JWT_LIFETIME_SECONDS` — integer, default `3600`
  - `MAX_IMAGE_SIZE_MB` — integer, default `5`
- `.env` file present at project root (gitignored)

**Build:**

- `pyproject.toml` — project metadata, dependencies, pylint config
- `alembic.ini` — migration runner config; `sqlalchemy.url` is intentionally blank (loaded from env at runtime by `migrations/env.py`)
- `.python-version` — pins Python 3.12 for pyenv/uv

## Database

**Engine:** PostgreSQL 16 (via Docker in development)

- Docker service: `db` in `docker-compose.yml`, port `5432`
- Default dev credentials: db=`insonia`, user=`insonia`, password=`insonia`
- Data persistence: named volume `postgres_data`

**Async driver:** `asyncpg` (SQLAlchemy async engine)
**Sync driver:** `psycopg` (Alembic offline migrations)

## Platform Requirements

**Development:**

- Python 3.12+
- uv package manager
- Docker + Docker Compose (for PostgreSQL)
- `.env` file with `DATABASE_URL` and `SECRET_KEY`

**Production:**

- ASGI server: uvicorn (included in dependencies)
- PostgreSQL database (any host)
- No deployment platform configuration detected (no Procfile, Dockerfile, or cloud-specific config files)

---

*Stack analysis: 2026-04-26*
