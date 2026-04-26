# Codebase Concerns

**Analysis Date:** 2026-04-26

## Tech Debt

**No test suite exists:**

- Issue: The `tests/` directory is empty. No pytest, httpx, or pytest-asyncio dependencies are declared in `pyproject.toml`. The ROADMAP.md defers testing to Phase 8, but all business logic (stock, sale creation, auth) is currently untested.
- Files: `tests/` (empty), `pyproject.toml`
- Impact: Regressions in critical paths (stock decrement, atomic sale creation) can ship silently.
- Fix approach: Add `pytest`, `pytest-asyncio`, `httpx` to `[dependency-groups]` dev in `pyproject.toml`. Create `tests/test_services.py` and `tests/test_graphql.py` targeting services and GraphQL mutations directly.

**Inline imports inside resolver functions:**

- Issue: `create_sale` mutation imports `select` and `Product` inside the function body (lines 46–48). `delete_sale` imports `remove_sale` inside its body (line 182). These are redundant — both modules are already imported at the top of the file.
- Files: `app/graphql/mutations.py` (lines 46–48, 182)
- Impact: Code smell; increases cognitive overhead and hides dependencies. In hot paths (sale creation is frequent), repeated name lookups in the local scope add minor overhead.
- Fix approach: Remove inline imports. All required symbols are already available at module level.

**Duplicate business logic in `create_sale` mutation:**

- Issue: `create_sale` in `app/graphql/mutations.py` manually fetches product prices from the DB (lines 52–63) instead of delegating entirely to `svc_create_sale`. This duplicates the product-lookup concern that should live in the service layer.
- Files: `app/graphql/mutations.py` (lines 50–64), `app/services/sale.py`
- Impact: Two places must be updated if pricing logic changes. The service layer is not the single source of truth for sale item construction.
- Fix approach: Move the product-price lookup into `create_sale` in `app/services/sale.py`, accepting only `product_id` and `quantity` as inputs. Remove the ad-hoc product queries from the mutation.

**No `update` mutations for Category and Brand:**

- Issue: `Mutation` class provides `create_brand`, `delete_brand`, `create_category`, `delete_category`, but no `update_brand` or `update_category`. `update_product` exists but `update_brand`/`update_category` are absent.
- Files: `app/graphql/mutations.py`
- Impact: Client has no way to rename a category or brand without deleting and recreating it, which breaks referential integrity (products referencing the old category/brand).
- Fix approach: Add `update_category(id: int, input: CategoryInput)` and `update_brand(id: int, input: BrandInput)` mutations following the same pattern as `update_product`.

**Empty migration c57cdf359e3d is noise:**

- Issue: Migration `c57cdf359e3d_add_users_table.py` has empty `upgrade()` and `downgrade()` bodies. The users table was already created in the initial migration `37d9af481f87`. This migration adds nothing but extends the migration chain.
- Files: `migrations/versions/c57cdf359e3d_add_users_table.py`
- Impact: Confusion about migration history; may cause issues if future auto-generated migrations base off of this revision.
- Fix approach: Either delete the empty migration (if never applied in any environment) or replace it with a squash that merges both revisions.

**`SlugMixin` does not update slug on name change:**

- Issue: `_generate_slug` in `app/models/mixins.py` only sets `target.slug` when `not target.slug`. On `before_update`, if a record already has a slug, no update occurs. The `update_product` mutation manually calls `slugify(input.name)` to work around this, but `update_category` and `update_brand` mutations do not — meaning renaming a category or brand leaves the slug stale.
- Files: `app/models/mixins.py` (line 7), `app/graphql/mutations.py` (line 117)
- Impact: Data inconsistency: category/brand slug diverges from name after a rename. Also inconsistent — product slug is manually updated in the resolver while category/brand rely on a broken mixin path.
- Fix approach: Change the condition in `_generate_slug` to always regenerate on update: remove `not target.slug` guard from the `before_update` listener, or split into separate insert/update handlers.

## Known Bugs

**`sale` query uses `selectinload().where()` incorrectly:**

- Symptoms: The query for a single sale (`sale(id)` resolver) applies `.where(Sale.id == id)` to the `selectinload(Sale.items)` relationship loader instead of to the outer `select(Sale)`. `selectinload` does not accept a `.where()` filter in this manner and will either silently ignore the filter or raise an error at runtime.
- Files: `app/graphql/queries.py` (lines 114–116)
- Trigger: Calling `sale(id: <any>)` GraphQL query.
- Workaround: None at runtime; the query returns incorrect or errored results.
- Fix approach: Move the `.where(Sale.id == id)` to the outer `select(Sale)` statement:

  ```python
  select(Sale).options(selectinload(Sale.items)).where(Sale.id == id)
  ```

**`scalar_one()` raises unhandled exception on missing records:**

- Symptoms: Mutations `update_product`, `delete_product`, `delete_category`, `delete_brand` call `result.scalar_one()`. If the record does not exist, SQLAlchemy raises `NoResultFound` — an unhandled 500 error instead of a 404.
- Files: `app/graphql/mutations.py` (lines 55, 105, 127, 149, 171)
- Trigger: Calling any delete/update mutation with a non-existent ID.
- Workaround: None; clients receive a 500 Internal Server Error.
- Fix approach: Replace `scalar_one()` with `scalar_one_or_none()` and raise a `strawberry.exceptions.GraphQLError` or return `None` with a message when the record is not found.

**Race condition in stock check/decrement:**

- Symptoms: `check_stock` reads stock in a separate `SELECT` then `decrement_stock` issues an `UPDATE`. Between these two statements, another concurrent transaction can decrement the same stock, allowing stock to go negative.
- Files: `app/services/stock.py` (lines 8–17, 20–27), `app/services/sale.py` (lines 22–43)
- Trigger: Two concurrent `create_sale` requests for the same product when stock is exactly 1.
- Workaround: None currently.
- Fix approach: Replace the `SELECT` + `UPDATE` two-step with a single `UPDATE ... WHERE stock >= quantity RETURNING stock` (or use `SELECT ... FOR UPDATE` pessimistic lock inside the transaction).

## Security Considerations

**SQL engine runs with `echo=True` unconditionally:**

- Risk: All SQL statements (including queries containing user IDs and order amounts) are logged to stdout regardless of `DEBUG` setting.
- Files: `app/core/database.py` (line 6)
- Current mitigation: None.
- Recommendations: Change to `echo=DEBUG` so verbose SQL logging is disabled in production: `create_async_engine(DATABASE_URL, echo=DEBUG)`.

**No CORS configuration:**

- Risk: FastAPI defaults to no CORS headers. When the frontend (`insonia-frontend/`) connects from a different origin in production, all cross-origin requests will be blocked. Conversely, if CORS is added carelessly as `allow_origins=["*"]` it becomes overly permissive.
- Files: `app/main.py` — no `CORSMiddleware` present.
- Current mitigation: None.
- Recommendations: Add `CORSMiddleware` with an explicit allowlist of origins driven by a `CORS_ORIGINS` env var before Phase 6 frontend wiring.

**No rate limiting on auth endpoints:**

- Risk: `POST /auth/register` and `POST /auth/login` are open to brute-force and enumeration attacks. No throttling middleware is configured.
- Files: `app/main.py`
- Current mitigation: None.
- Recommendations: Add `slowapi` or a similar rate-limiting middleware to the auth prefix before any public exposure.

**`reset_password_token_secret` and `verification_token_secret` share `SECRET_KEY`:**

- Risk: Using the same secret for JWT authentication, password reset tokens, and email verification tokens means a compromised token of one type can potentially be replayed in another context.
- Files: `app/core/auth.py` (lines 24–25)
- Current mitigation: fastapi-users adds audience claims to tokens, providing partial isolation.
- Recommendations: Define separate env vars `RESET_PASSWORD_SECRET` and `VERIFICATION_SECRET` and assign them independently.

**`user_id` exposed in `SaleType` GraphQL response:**

- Risk: `SaleType` in `app/graphql/types.py` (line 79) and `sale_model_to_type` in `app/graphql/queries.py` (line 43) expose `user_id` as a public field. Any authenticated user can call `all_sales` and receive the user IDs of all other users' transactions.
- Files: `app/graphql/types.py` (line 79), `app/graphql/queries.py` (lines 39–57, 104–108)
- Current mitigation: None.
- Recommendations: Filter `all_sales` to only return the current user's sales (scoped by `info.context["user"].id`), and consider removing `user_id` from `SaleType` or making it a private field.

**No authorization checks on mutations (missing ownership validation):**

- Risk: All mutations (`delete_product`, `update_product`, `delete_category`, `delete_sale`, etc.) only require the user to be authenticated (`current_active_user`), not to own or have permission to modify the resource. Any logged-in user can delete any other user's sale or any product.
- Files: `app/graphql/mutations.py`, `app/graphql/schema.py`
- Current mitigation: Requires authentication; no RBAC or ownership check.
- Recommendations: Add a permission layer (Strawberry permission classes or inline checks). At minimum, verify `sale.user_id == user.id` before allowing `delete_sale`. Restrict product/brand/category mutations to superusers.

## Performance Bottlenecks

**`all_products` and `all_sales` have no pagination:**

- Problem: `all_products` returns every product, `all_sales` returns every sale in a single query.
- Files: `app/graphql/queries.py` (lines 65–69, 104–108)
- Cause: No `LIMIT`/`OFFSET` or cursor-based pagination applied to list resolvers.
- Improvement path: Add `limit: int = 100` and `offset: int = 0` arguments to list resolvers. For sales, cursor pagination on `sale_date` is more appropriate for time-series data.

**N+1 potential: `product_model_to_type` does not load category/brand:**

- Problem: `ProductType` does not currently expose `category` or `brand`, but the model has FK columns. When these are added (Phase 6 wiring), naively mapping `p.category` inside a list resolver will trigger one SQL query per product.
- Files: `app/graphql/queries.py` (lines 22–36, 65–69)
- Cause: No eager-loading strategy is specified for products in `all_products`.
- Improvement path: Add `selectinload(Product.category)` and `selectinload(Product.brand)` to the `all_products` query before exposing those relations in `ProductType`.

## Fragile Areas

**`SlugMixin` uses SQLAlchemy sync events on async engine:**

- Files: `app/models/mixins.py`
- Why fragile: `event.listens_for(cls, "before_insert", _generate_slug)` registers a synchronous ORM event. In async mode, SQLAlchemy calls this hook correctly for ORM-level inserts, but any bulk insert that bypasses the ORM (e.g., `insert()` core expression) will silently skip slug generation.
- Safe modification: Treat `SlugMixin` as ORM-only. Never use core `insert()` for models that inherit `SlugMixin`. Document this constraint.
- Test coverage: No tests exist that verify slug generation or its absence in edge cases.

**`create_sale` opens a nested transaction via `async with db.begin()`:**

- Files: `app/services/sale.py` (line 22), `app/graphql/mutations.py` (line 65)
- Why fragile: The `db` session is provided by `get_db()` which uses `AsyncSessionLocal()` — a session without an active transaction. `db.begin()` inside `create_sale` starts a transaction. If the calling code (e.g., GraphQL middleware or Strawberry) has already begun a transaction on the same session, nesting `db.begin()` creates a savepoint, and failures inside may not roll back as expected.
- Safe modification: Always pass a fresh session to service functions, or document that `create_sale` and `remove_sale` require a session with no active transaction.
- Test coverage: Zero.

**`remove_sale` raises `HTTPException` from a service layer:**

- Files: `app/services/sale.py` (line 64–66)
- Why fragile: Services importing and raising `fastapi.HTTPException` couples the service layer to the HTTP transport. If the service is ever called from a background task, a CLI tool, or a test that does not have an HTTP request context, the exception is meaningless.
- Safe modification: Raise a domain-level exception (e.g., `SaleNotFoundError`) in the service, and translate it to `HTTPException` or a GraphQL error at the resolver layer.

## Scaling Limits

**Local filesystem image storage planned (Phase 5):**

- Current capacity: Not yet implemented; ROADMAP.md plans both local path and S3 as options.
- Limit: Local storage does not scale horizontally — multiple app instances cannot share uploaded files.
- Scaling path: Implement S3 (or compatible object store) from the start rather than local-first. The `MAX_IMAGE_SIZE_MB` config already exists in `app/core/config.py`.

**Single PostgreSQL instance, no connection pooling configuration:**

- Current capacity: `create_async_engine(DATABASE_URL, echo=True)` with default pool settings (5 connections).
- Limit: Default SQLAlchemy async pool size of 5 active + 10 overflow. Under concurrent load, requests will queue waiting for connections.
- Scaling path: Tune `pool_size` and `max_overflow` in `create_async_engine`. Add `pgbouncer` for connection pooling in front of PostgreSQL.

## Dependencies at Risk

**`fastapi-users` version pinned loosely (`>=12.1.3`):**

- Risk: Major version bumps (v13+) in `fastapi-users` have historically introduced breaking changes to the `BaseUserManager` API, `UserDB` adapters, and router generation signatures.
- Impact: `app/core/auth.py` and `app/schemas/user.py` would need updates on a major version bump.
- Migration plan: Pin to a minor range (`>=12.1.3,<13`) in `pyproject.toml` and review release notes before upgrading.

**No `pytest` or test runner declared in dependencies:**

- Risk: The test infrastructure described in ROADMAP.md Phase 8 (`pytest`, `pytest-asyncio`, `httpx`) does not exist in `pyproject.toml`. A developer cloning the repo cannot run tests without manually installing unlisted packages.
- Impact: CI cannot be set up and test commands cannot be standardized.
- Migration plan: Add `pytest>=8`, `pytest-asyncio>=0.24`, `httpx>=0.27` to `[dependency-groups]` dev.

## Missing Critical Features

**No pagination on list queries:**

- Problem: `all_products`, `all_sales`, `all_categories`, `all_brands` return unbounded result sets.
- Blocks: Production readiness — any catalog with more than a few hundred products will cause slow queries and large GraphQL payloads.

**No image upload endpoints:**

- Problem: `ProductImage` model and `produto_imagens` table exist in the DB schema, but no upload endpoint or mutation is implemented (Phase 5 in ROADMAP.md).
- Blocks: Products cannot have images; frontend product display is incomplete.

**No user roles or ownership model:**

- Problem: All authenticated users have identical permissions. There is no `is_staff`/`is_operator` distinction. Any user can delete any other user's sales.
- Blocks: Multi-user production deployment; any frontend that assumes ownership of data.

**No CORS configuration:**

- Problem: Frontend (`insonia-frontend/`) cannot connect to the API from a browser without same-origin or proper CORS headers.
- Blocks: Phase 6 and 7 frontend wiring.

## Test Coverage Gaps

**Service layer entirely untested:**

- What's not tested: `create_sale` atomicity, stock check/decrement, `remove_sale` with stock restoration, negative quantity, zero quantity, insufficient stock path.
- Files: `app/services/sale.py`, `app/services/stock.py`
- Risk: Silent regression in financial logic (wrong totals, negative stock) with no automated detection.
- Priority: High

**GraphQL mutations have no integration tests:**

- What's not tested: `create_product`, `update_product`, `delete_product`, `create_sale`, `delete_sale`, `create_category`, `create_brand`, and all authorization paths.
- Files: `app/graphql/mutations.py`, `app/graphql/queries.py`
- Risk: The `sale` query bug (`selectinload().where()`) and the `scalar_one()` missing-record crash cannot be caught without running GraphQL queries.
- Priority: High

**Auth flows untested:**

- What's not tested: Register, login, token expiry, protected route returns 401 when unauthenticated.
- Files: `app/core/auth.py`, `app/main.py`
- Risk: A misconfiguration in `fastapi-users` setup would not surface until manual testing.
- Priority: Medium

---

*Concerns audit: 2026-04-26*
