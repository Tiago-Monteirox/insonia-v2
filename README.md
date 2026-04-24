# Insonia v2

Reconstrucao do backend do Insonia com FastAPI, SQLAlchemy async, PostgreSQL e Strawberry GraphQL.

O frontend ja existe em [`insonia-frontend/`](./insonia-frontend), mas neste momento o repositorio esta apenas com a camada de infraestrutura do backend de pe. As camadas de dominio, modelos, auth, GraphQL e integracao com o frontend ainda nao foram implementadas.

## Estado atual

Hoje o projeto entrega:

- estrutura base do backend em `app/`
- aplicacao FastAPI inicial em [`app/main.py`](./app/main.py)
- endpoint `GET /health`
- configuracao central via `.env` em [`app/core/config.py`](./app/core/config.py)
- engine e session factory async do SQLAlchemy em [`app/core/database.py`](./app/core/database.py)
- PostgreSQL local via [`docker-compose.yml`](./docker-compose.yml)
- dependencias gerenciadas com `uv`

Hoje o projeto ainda nao entrega:

- modelos SQLAlchemy
- migrations com Alembic
- autenticacao
- schema GraphQL
- regras de negocio
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
│   ├── routers/
│   ├── schemas/
│   ├── services/
│   └── main.py
├── insonia-frontend/
├── docker-compose.yml
├── IMPL_GUIDE.md
├── ROADMAP.md
├── pyproject.toml
└── uv.lock
```

As pastas `models`, `schemas`, `graphql`, `routers` e `services` existem como base de organizacao, mas ainda estao vazias na pratica.

## Requisitos

- Python 3.12+
- `uv`
- Docker e Docker Compose

## Variaveis de ambiente

Existe um `.env` local no projeto. Para subir o backend do jeito esperado pelo codigo atual, ele precisa conter pelo menos:

```env
DATABASE_URL=postgresql+asyncpg://insonia:insonia@localhost:5432/insonia
SECRET_KEY=troque-isso-por-uma-string-longa-e-aleatoria
DEBUG=True
JWT_LIFETIME_SECONDS=3600
MAX_IMAGE_SIZE_MB=5
```

Observacao: no estado atual, o endpoint `/health` nao depende do banco, mas as configuracoes de banco ja estao preparadas para as proximas fases.

## Como rodar

### 1. Subir o PostgreSQL

```bash
docker compose up -d db
```

### 2. Instalar as dependencias

```bash
uv sync
```

### 3. Subir a API

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

## Observacoes importantes

- O ponto de entrada da API hoje e `app.main:app`.
- O arquivo [`main.py`](./main.py) na raiz e apenas o placeholder gerado no setup inicial e nao e o entrypoint do servidor FastAPI.
- O `docker-compose.yml` atual sobe somente o banco PostgreSQL.
- A conexao SQLAlchemy ja esta configurada, mas ainda nao ha modelos nem migrations aplicadas.
- O frontend em `insonia-frontend/` ainda nao esta conectado a este backend.

## Proximos passos

Seguindo o planejamento atual, as proximas entregas naturais sao:

1. criar os modelos SQLAlchemy do dominio
2. configurar Alembic e gerar a migration inicial
3. implementar autenticacao
4. montar o schema GraphQL
5. conectar o frontend existente ao backend
