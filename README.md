# Insonia v2

Reconstrucao do backend do Insonia com FastAPI, SQLAlchemy async, PostgreSQL e Strawberry GraphQL.

O frontend ja existe em [`insonia-frontend/`](./insonia-frontend). No backend, o projeto ja saiu do estado de "somente infra" e agora conta com a base de modelagem do dominio e a migration inicial do banco. Ainda assim, a aplicacao exposta continua minima: por enquanto so existe o `healthcheck`, e as camadas de auth, servicos, GraphQL e integracao com o frontend ainda nao foram conectadas.

## Estado atual

Hoje o projeto entrega:

- estrutura base do backend em `app/`
- aplicacao FastAPI inicial em [`app/main.py`](./app/main.py)
- endpoint `GET /health`
- configuracao central via `.env` em [`app/core/config.py`](./app/core/config.py)
- engine e session factory async do SQLAlchemy em [`app/core/database.py`](./app/core/database.py)
- modelos SQLAlchemy do dominio em [`app/models/`](./app/models)
- geracao automatica de slug para entidades com nome
- setup do Alembic em [`alembic.ini`](./alembic.ini) e [`migrations/`](./migrations)
- migration inicial do schema em [`migrations/versions/37d9af481f87_initial.py`](./migrations/versions/37d9af481f87_initial.py)
- PostgreSQL local via [`docker-compose.yml`](./docker-compose.yml)
- dependencias gerenciadas com `uv`

Hoje o projeto ainda nao entrega:

- fluxo de autenticacao exposto na API
- endpoints REST de dominio
- schema GraphQL
- regras de negocio em `services`
- testes
- integracao real com o frontend

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
│   │   ├── config.py
│   │   └── database.py
│   ├── graphql/
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
│   ├── services/
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

As pastas `graphql`, `routers`, `schemas` e `services` ainda estao reservadas para as proximas fases. O bloco mais avancado do backend hoje esta em `models` e `migrations`.

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

O modelo `User` ja usa a base do `fastapi-users`, mas o fluxo de autenticacao ainda nao foi exposto em rotas.

## Banco de dados e migrations

O projeto ja possui:

- engine async com SQLAlchemy 2.x
- metadata centralizada em `Base`
- Alembic configurado para ler `DATABASE_URL`
- import dos modelos em `migrations/env.py` para autogenerate
- migration inicial criando as tabelas do dominio

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

## Endpoints disponiveis hoje

### `GET /health`

Retorna:

```json
{"status":"ok"}
```

## O que ainda esta pendente

- registrar routers reais no FastAPI
- expor auth com `fastapi-users`
- implementar schema e resolvers GraphQL
- criar schemas Pydantic
- mover regras de negocio para `app/services`
- adicionar testes
- conectar o frontend existente ao backend

## Observacoes importantes

- O ponto de entrada da API hoje e `app.main:app`.
- O arquivo [`main.py`](./main.py) na raiz e apenas o placeholder gerado no setup inicial e nao e o entrypoint do servidor FastAPI.
- O `docker-compose.yml` atual sobe somente o banco PostgreSQL.
- Embora os modelos e a migration inicial existam, a aplicacao ainda nao usa esses modelos em rotas reais.
- O frontend em `insonia-frontend/` ainda nao esta conectado a este backend.

## Proximos passos

Seguindo o estado atual do repositorio, a sequencia natural agora e:

1. expor autenticacao e dependencia de usuario atual
2. criar services de negocio para produto, estoque e venda
3. montar queries e mutations GraphQL
4. adicionar testes para models, migrations e regras de negocio
5. conectar o frontend existente ao backend
