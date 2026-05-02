# Insonia v2

Reconstrução do backend do Insonia com FastAPI, SQLAlchemy async, PostgreSQL e Strawberry GraphQL.

O frontend já existe em [`insonia-frontend/`](./insonia-frontend). O backend entrega autenticação JWT,
domínio completo de produtos/categorias/marcas/vendas via GraphQL, serviços de estoque com atomicidade,
rate limiting nos endpoints de auth e um schema GraphQL completo montado no FastAPI.

## Estado atual

O projeto entrega hoje:

- aplicação FastAPI com auth e GraphQL em [`app/main.py`](./app/main.py)
- endpoint `GET /health`
- configuração central via `.env` em [`app/core/config.py`](./app/core/config.py)
- engine e session factory async do SQLAlchemy em [`app/core/database.py`](./app/core/database.py)
- modelos SQLAlchemy do domínio completo em [`app/models/`](./app/models)
- geração automática de slug para entidades com nome via `SlugMixin`
- autenticação JWT com `fastapi-users` — secrets separados para JWT, reset e verificação
- usuário autenticado injetado no contexto de cada resolver GraphQL
- schema GraphQL com CRUD completo de produto, categoria, marca e venda em [`app/graphql/`](./app/graphql)
- queries de lista com paginação (`limit` / `offset`)
- `allSales` filtrado pelo usuário autenticado
- mutations de produto/categoria/marca restritas a superusuários
- `deleteSale` com verificação de posse
- decremento de estoque atômico via `UPDATE ... RETURNING` (sem race condition)
- rate limiting por IP no prefixo `/auth` via middleware ASGI
- suíte de testes com 24 testes cobrindo serviços, mutations, auth e fluxo E2E
- setup do Alembic em [`alembic.ini`](./alembic.ini) e [`migrations/`](./migrations)
- PostgreSQL local via [`docker-compose.yml`](./docker-compose.yml)
- dependências gerenciadas com `uv`

O projeto ainda não entrega:

- CORS configurado
- upload de imagens (Fase 5)
- integração real com o frontend (Fase 6)

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework web | FastAPI |
| ORM | SQLAlchemy 2.x async |
| Banco de dados | PostgreSQL 16 |
| GraphQL | Strawberry |
| Auth | fastapi-users + JWT |
| Validação | Pydantic v2 |
| Migrations | Alembic |
| Gerenciador de pacotes | uv |

## Estrutura

```text
insonia-v2/
├── app/
│   ├── core/
│   │   ├── auth.py          # fastapi-users, JWT strategy, secrets separados
│   │   ├── config.py        # variáveis de ambiente via python-decouple
│   │   └── database.py      # engine async, session factory, Base
│   ├── graphql/
│   │   ├── inputs.py        # ProductInput, CategoryInput, BrandInput
│   │   ├── mutations.py     # CRUD de produto, categoria, marca, venda
│   │   ├── queries.py       # queries de listagem (paginadas) e busca por ID
│   │   ├── schema.py        # montagem do schema + contexto (db, user)
│   │   └── types.py         # tipos GraphQL do domínio
│   ├── models/
│   │   ├── brand.py
│   │   ├── category.py
│   │   ├── mixins.py        # SlugMixin (auto-slug via eventos SQLAlchemy)
│   │   ├── product.py       # Product + ProductImage
│   │   ├── sale.py          # Sale + SaleItem
│   │   ├── user.py
│   │   └── variation.py     # VariationName, VariationValue, Variation
│   ├── routers/
│   │   └── auth_rate_limit.py  # AuthRateLimitMiddleware (sliding window por IP)
│   ├── schemas/
│   │   └── user.py          # UserRead, UserCreate, UserUpdate
│   ├── services/
│   │   ├── sale.py          # create_sale (atômico), remove_sale
│   │   └── stock.py         # decrement_stock_atomic, increment_stock
│   └── main.py              # entrypoint da API
├── migrations/
│   └── versions/
│       └── 37d9af481f87_initial.py
├── tests/
│   ├── conftest.py          # fixtures: db, product, user, client, auth_client
│   ├── test_stock.py        # testes unitários do serviço de estoque
│   ├── test_sale_service.py # testes unitários do serviço de venda
│   ├── test_graphql_mutations.py  # testes das mutations GraphQL
│   ├── test_auth.py         # testes do fluxo de autenticação
│   └── test_e2e_pdv.py      # testes E2E do caminho crítico do PDV
├── .planning/
│   └── codebase/            # mapa do codebase gerado por análise estática
├── alembic.ini
├── docker-compose.yml
├── FIXES_GUIDE.md           # bugs e dívida técnica (concluído)
├── IMPL_GUIDE.md            # passo a passo completo de implementação
├── ROADMAP.md               # fases do projeto
├── pyproject.toml
└── uv.lock
```

## Requisitos

- Python 3.12+
- `uv`
- Docker e Docker Compose

## Como rodar

```bash
# 1. Subir o PostgreSQL
docker compose up -d db

# 2. Instalar dependências
uv sync

# 3. Aplicar migrations
uv run alembic upgrade head

# 4. Subir a API
uv run uvicorn app.main:app --reload
```

API disponível em:

- `http://localhost:8000/health`
- `http://localhost:8000/docs`
- `http://localhost:8000/graphql`

## Variáveis de ambiente

Crie um `.env` na raiz com:

```env
DATABASE_URL=postgresql+asyncpg://insonia:insonia@localhost:5432/insonia
SECRET_KEY=string-longa-e-aleatoria
RESET_PASSWORD_SECRET=outra-string-longa-aleatoria
VERIFICATION_SECRET=mais-uma-string-longa-aleatoria
DEBUG=False
JWT_LIFETIME_SECONDS=3600
MAX_IMAGE_SIZE_MB=5
```

`DEBUG` deve ser `True` ou `False`. Quando `True`, o SQLAlchemy loga todas as queries no stdout —
nunca use `True` em produção.

## Autenticação

Rotas geradas automaticamente pelo `fastapi-users`:

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Cadastro de novo usuário |
| POST | `/auth/login` | Login — retorna JWT |
| POST | `/auth/logout` | Logout |
| GET | `/users/me` | Dados do usuário logado |
| PATCH | `/users/me` | Atualizar perfil |
| GET | `/users/{id}` | Buscar usuário por ID |

O token JWT deve ser enviado no header `Authorization: Bearer <token>` em todas as requests autenticadas,
incluindo queries e mutations GraphQL.

Os endpoints `/auth/*` têm rate limiting de 10 requisições por minuto por IP.

## GraphQL

Endpoint: `POST /graphql` — interface interativa em `http://localhost:8000/graphql`

Todas as operações requerem autenticação. No cliente GraphQL, adicione o header:
```json
{"Authorization": "Bearer <token>"}
```

### Queries

| Query | Parâmetros | Descrição |
|-------|------------|-----------|
| `allProducts(limit, offset)` | `limit=100`, `offset=0` | Lista produtos paginados |
| `product(id)` | — | Busca produto por ID |
| `allCategories(limit, offset)` | `limit=20`, `offset=0` | Lista categorias paginadas |
| `allBrands(limit, offset)` | `limit=20`, `offset=0` | Lista marcas paginadas |
| `brand(id)` | — | Busca marca por ID |
| `allSales(limit, offset)` | `limit=50`, `offset=0` | Vendas do usuário autenticado, ordenadas por data desc |
| `sale(id)` | — | Busca venda por ID |

### Mutations

| Mutation | Permissão | Descrição |
|----------|-----------|-----------|
| `createProduct(input)` | superuser | Cria produto |
| `updateProduct(id, input)` | superuser | Atualiza produto |
| `deleteProduct(id)` | superuser | Remove produto |
| `createCategory(input)` | superuser | Cria categoria |
| `updateCategory(id, input)` | superuser | Atualiza categoria |
| `deleteCategory(id)` | superuser | Remove categoria |
| `createBrand(input)` | superuser | Cria marca |
| `updateBrand(id, input)` | superuser | Atualiza marca |
| `deleteBrand(id)` | superuser | Remove marca |
| `createSale(items)` | autenticado | Cria venda (decrementa estoque atomicamente) |
| `deleteSale(id)` | dono ou superuser | Cancela venda (restaura estoque) |

### Exemplo rápido

```graphql
# Criar produto (requer superuser)
mutation {
  createProduct(input: {
    name: "Camiseta Preta M"
    salePrice: 89.90
    costPrice: 35.00
    stock: 50
    currency: "BRL"
  }) {
    id name slug salePrice { amount currency }
  }
}

# Registrar venda
mutation {
  createSale(items: [{ productId: 1, quantity: 2 }]) {
    id totalAmount totalProfit
  }
}

# Listar vendas com paginação
query {
  allSales(limit: 10, offset: 0) {
    id saleDate totalAmount totalProfit
    items { productId quantity }
  }
}
```

## Serviços de negócio

A camada de serviços em `app/services/` contém as regras críticas do domínio:

- **`create_sale`** — busca preços do banco, decrementa estoque atomicamente via `UPDATE ... RETURNING`
  e persiste todos os itens dentro de uma única transação. Se qualquer item falhar, a venda inteira é revertida.
- **`remove_sale`** — cancela a venda e restaura o estoque de cada item.
- **`decrement_stock_atomic`** — decremento atômico sem race condition: um único `UPDATE` com
  `WHERE stock >= quantity` garante que dois pedidos simultâneos não levem o estoque a negativo.
- **`increment_stock`** — restaura estoque ao cancelar uma venda.

## Banco de dados

Tabelas criadas pelas migrations:

| Tabela | Modelo |
|--------|--------|
| `users` | `User` |
| `categorias` | `Category` |
| `marcas` | `Brand` |
| `produtos` | `Product` |
| `produto_imagens` | `ProductImage` |
| `nome_variacoes` | `VariationName` |
| `valor_variacoes` | `VariationValue` |
| `variacoes` | `Variation` |
| `vendas` | `Sale` |
| `itens_venda` | `SaleItem` |

Comandos úteis:

```bash
# Nova migration
uv run alembic revision --autogenerate -m "descricao"

# Aplicar
uv run alembic upgrade head

# Reverter última
uv run alembic downgrade -1

# Ver estado atual
uv run alembic current
```

## Documentação

| Arquivo | Conteúdo |
|---------|----------|
| [`IMPL_GUIDE.md`](./IMPL_GUIDE.md) | Passo a passo completo de implementação de cada fase |
| [`ROADMAP.md`](./ROADMAP.md) | Visão geral das fases do projeto |
| [`.planning/codebase/`](./.planning/codebase/) | Mapa do codebase (stack, arquitetura, convenções, concerns) |

## Testes

O banco de testes precisa existir antes de rodar a suíte:

```bash
docker compose exec db psql -U insonia -c "CREATE DATABASE insonia_test;"
```

Rodar todos os testes:

```bash
uv run pytest tests/ -v
```

| Arquivo | Cobertura |
|---------|-----------|
| `test_stock.py` | `check_stock_atomic`, `decrement_stock_atomic`, `increment_stock` |
| `test_sale_service.py` | `create_sale` (rollback em estoque insuficiente), `remove_sale` |
| `test_graphql_mutations.py` | CRUD de produto, categoria, marca e venda via GraphQL |
| `test_auth.py` | Register, login, rotas protegidas, token inválido |
| `test_e2e_pdv.py` | Fluxo completo PDV: criar produto → vender → cancelar → verificar estoque |

**Decisões de design dos testes:**
- `NullPool` no engine de testes — evita reutilizar conexões asyncpg entre event loops distintos (`asyncio_default_fixture_loop_scope=function` cria um event loop por teste)
- `TRUNCATE ... RESTART IDENTITY CASCADE` após cada teste — isolamento sem custo de `drop_all`/`create_all`
- Fixtures `user` e `auth_client` criam superuser + JWT; cada request HTTP usa sessão própria

## Próximos passos

1. Upload de imagens — Fase 5
2. Conectar frontend — Fase 6
