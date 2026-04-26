# Insonia v2

Reconstrucao do backend do Insonia com FastAPI, SQLAlchemy async, PostgreSQL e Strawberry GraphQL.

O frontend ja existe em [`insonia-frontend/`](./insonia-frontend). No backend, o projeto ja saiu do estado de "somente infra" e agora conta com modelagem inicial do dominio, migration inicial, autenticacao JWT via `fastapi-users`, servicos de estoque e venda e um schema GraphQL montado no FastAPI.

## Estado atual

Hoje o projeto entrega:

- estrutura base do backend em `app/`
- aplicacao FastAPI com auth e GraphQL em [`app/main.py`](./app/main.py)
- endpoint `GET /health`
- configuracao central via `.env` em [`app/core/config.py`](./app/core/config.py)
- engine e session factory async do SQLAlchemy em [`app/core/database.py`](./app/core/database.py)
- modelos SQLAlchemy do dominio em [`app/models/`](./app/models)
- geracao automatica de slug para entidades com nome
- autenticacao JWT com `fastapi-users` em [`app/core/auth.py`](./app/core/auth.py)
- schemas de usuario em [`app/schemas/user.py`](./app/schemas/user.py)
- schema GraphQL com queries e mutations em [`app/graphql/`](./app/graphql)
- servicos de estoque e venda em [`app/services/`](./app/services)
- setup do Alembic em [`alembic.ini`](./alembic.ini) e [`migrations/`](./migrations)
- migration inicial do schema em [`migrations/versions/37d9af481f87_initial.py`](./migrations/versions/37d9af481f87_initial.py)
- PostgreSQL local via [`docker-compose.yml`](./docker-compose.yml)
- dependencias gerenciadas com `uv`

Hoje o projeto ainda nao entrega:

- endpoints REST de dominio
- testes
- integracao real com o frontend
- cobertura completa de dominio no GraphQL
- wiring completo de autenticacao dentro dos resolvers GraphQL

## Stack prevista

- FastAPI
- SQLAlchemy 2.x async
- PostgreSQL
- Strawberry GraphQL
- FastAPI Users
- Pydantic v2
- Alembic
- `uv`

O direcionamento completo das proximas fases esta em [`ROADMAP.md`](./ROADMAP.md) e o passo a passo de implementacao esta em [`IMPL_GUIDE.md`](./IMPL_GUIDE.md).

## Estrutura atual

```text
insonia-v2/
├── app/
│   ├── core/
│   │   ├── auth.py
│   │   ├── config.py
│   │   └── database.py
│   ├── graphql/
│   │   ├── mutations.py
│   │   ├── queries.py
│   │   ├── schema.py
│   │   └── types.py
│   ├── models/
│   │   ├── brand.py
│   │   ├── category.py
│   │   ├── mixins.py
│   │   ├── product.py
│   │   ├── sale.py
│   │   ├── user.py
│   │   └── variation.py
│   ├── routers/
│   ├── schemas/
│   │   └── user.py
│   ├── services/
│   │   ├── sale.py
│   │   └── stock.py
│   └── main.py
├── migrations/
│   └── versions/
│       └── 37d9af481f87_initial.py
├── alembic.ini
├── insonia-frontend/
├── docker-compose.yml
├── IMPL_GUIDE.md
├── ROADMAP.md
├── pyproject.toml
└── uv.lock
```

As pastas `routers` ainda estao praticamente reservadas para as proximas fases. Hoje, os blocos mais avancados do backend estao em `models`, `migrations`, `core/auth`, `graphql` e `services`.

## Modelos ja implementados

- `Category`
- `Brand`
- `Product`
- `ProductImage`
- `VariationName`
- `VariationValue`
- `Variation`
- `Sale`
- `SaleItem`
- `User`

O modelo `User` usa a base do `fastapi-users` e ja esta conectado as rotas de autenticacao da API.

## Autenticacao

A autenticacao ja esta montada com `fastapi-users` e backend JWT bearer.

Rotas atualmente registradas:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /users/me`
- `PATCH /users/me`
- `GET /users/{id}`

O backend usa:

- `JWTStrategy` com `SECRET_KEY`
- expiracao configurada por `JWT_LIFETIME_SECONDS`
- modelo `User` baseado em `SQLAlchemyBaseUserTable[int]`
- schemas `UserRead`, `UserCreate` e `UserUpdate`

## GraphQL

O endpoint GraphQL ja esta montado em:

- `POST /graphql`

Schema atual:

- queries `allProducts`, `product(id)` e `allCategories`
- mutation `createSale(items)`
- tipos `MoneyType`, `CategoryType`, `BrandType` e `ProductType`

O schema usa `Strawberry` com `GraphQLRouter` e injeta a sessao async do banco no contexto.

## Banco de dados e migrations

O projeto ja possui:

- engine async com SQLAlchemy 2.x
- metadata centralizada em `Base`
- Alembic configurado para ler `DATABASE_URL`
- import dos modelos em `migrations/env.py` para autogenerate
- migration inicial criando as tabelas do dominio

## Servicos de negocio

Ja existem servicos iniciais para:

- validacao de estoque
- decremento de estoque
- incremento de estoque
- criacao atomica de venda
- remocao de venda com reposicao de estoque

Essas regras hoje vivem em [`app/services/stock.py`](./app/services/stock.py) e [`app/services/sale.py`](./app/services/sale.py).

Tabelas previstas na migration inicial:

- `categorias`
- `marcas`
- `produtos`
- `produto_imagens`
- `nome_variacoes`
- `valor_variacoes`
- `variacoes`
- `users`
- `vendas`
- `itens_venda`

## Requisitos

- Python 3.12+
- `uv`
- Docker e Docker Compose

## Variaveis de ambiente

Existe um `.env` local no projeto. Para subir o backend e rodar migrations, ele precisa conter pelo menos:

```env
DATABASE_URL=postgresql+asyncpg://insonia:insonia@localhost:5432/insonia
SECRET_KEY=troque-isso-por-uma-string-longa-e-aleatoria
DEBUG=False
JWT_LIFETIME_SECONDS=3600
MAX_IMAGE_SIZE_MB=5
```

Observacao importante: `DEBUG` precisa ser um booleano valido para o `python-decouple`, como `True` ou `False`.

## Como rodar

### 1. Subir o PostgreSQL

```bash
docker compose up -d db
```

### 2. Instalar as dependencias

```bash
uv sync
```

### 3. Aplicar as migrations

```bash
uv run alembic upgrade head
```

### 4. Subir a API

```bash
uv run uvicorn app.main:app --reload
```

API disponivel em:

- `http://localhost:8000/health`
- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`
- `http://localhost:8000/graphql`

## Endpoints disponiveis hoje

### `GET /health`

Retorna:

```json
{"status":"ok"}
```

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /users/me`
- `PATCH /users/me`
- `GET /users/{id}`

### GraphQL

Endpoint:

```text
/graphql
```

Queries disponiveis hoje:

- `allProducts`
- `product(id)`
- `allCategories`

Mutation disponivel hoje:

- `createSale(items)`

## O que ainda esta pendente

- registrar routers reais no FastAPI
- adicionar testes
- conectar o frontend existente ao backend
- expandir queries e mutations para cobrir o dominio inteiro
- integrar auth de forma completa dentro do fluxo GraphQL
- expor REST de negocio, caso essa camada seja mantida

## Observacoes importantes

- O ponto de entrada da API hoje e `app.main:app`.
- O arquivo [`main.py`](./main.py) na raiz e apenas o placeholder gerado no setup inicial e nao e o entrypoint do servidor FastAPI.
- O `docker-compose.yml` atual sobe somente o banco PostgreSQL.
- Auth e GraphQL ja estao montados, mas a cobertura funcional ainda e parcial.
- O frontend em `insonia-frontend/` ainda nao esta conectado a este backend.

## Proximos passos

Seguindo o estado atual do repositorio, a sequencia natural agora e:

1. expandir o schema GraphQL para marcas, vendas, historico e operacoes de produto
2. fortalecer o fluxo autenticado dentro dos resolvers e mutations
3. adicionar testes para auth, services e GraphQL
4. decidir se a camada REST de dominio sera mantida ou se o backend sera GraphQL-first
5. conectar o frontend existente ao backend
