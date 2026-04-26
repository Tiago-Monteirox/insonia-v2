# Insonia v2

Reconstrução do backend do Insonia com FastAPI, SQLAlchemy async, PostgreSQL e Strawberry GraphQL.

O frontend já existe em [`insonia-frontend/`](./insonia-frontend). O backend saiu do estado de infra e hoje entrega
autenticação JWT, domínio completo de produtos/categorias/marcas/vendas via GraphQL, serviços de estoque com
atomicidade e um schema GraphQL completo montado no FastAPI.

Antes de avançar para as próximas fases, leia [`FIXES_GUIDE.md`](./FIXES_GUIDE.md) — ele lista bugs conhecidos,
dívida técnica e issues de segurança a corrigir primeiro.

## Estado atual

O projeto entrega hoje:

- aplicação FastAPI com auth e GraphQL em [`app/main.py`](./app/main.py)
- endpoint `GET /health`
- configuração central via `.env` em [`app/core/config.py`](./app/core/config.py)
- engine e session factory async do SQLAlchemy em [`app/core/database.py`](./app/core/database.py)
- modelos SQLAlchemy do domínio completo em [`app/models/`](./app/models)
- geração automática de slug para entidades com nome via `SlugMixin`
- autenticação JWT com `fastapi-users` em [`app/core/auth.py`](./app/core/auth.py)
- usuário autenticado injetado no contexto de cada resolver GraphQL
- schema GraphQL com CRUD completo de produto, categoria, marca e venda em [`app/graphql/`](./app/graphql)
- inputs tipados para mutations em [`app/graphql/inputs.py`](./app/graphql/inputs.py)
- serviços de estoque e venda em [`app/services/`](./app/services)
- setup do Alembic em [`alembic.ini`](./alembic.ini) e [`migrations/`](./migrations)
- PostgreSQL local via [`docker-compose.yml`](./docker-compose.yml)
- dependências gerenciadas com `uv`

O projeto ainda não entrega:

- testes (veja Fase 3.5 e 4.6 em [`IMPL_GUIDE.md`](./IMPL_GUIDE.md))
- paginação nas queries de lista
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
│   │   ├── auth.py          # fastapi-users, JWT strategy
│   │   ├── config.py        # variáveis de ambiente via python-decouple
│   │   └── database.py      # engine async, session factory, Base
│   ├── graphql/
│   │   ├── inputs.py        # ProductInput, CategoryInput, BrandInput
│   │   ├── mutations.py     # CRUD de produto, categoria, marca, venda
│   │   ├── queries.py       # queries de listagem e busca por ID
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
│   ├── routers/             # reservado para Fase 5+ (upload, etc.)
│   ├── schemas/
│   │   └── user.py          # UserRead, UserCreate, UserUpdate
│   ├── services/
│   │   ├── sale.py          # create_sale (atômico), remove_sale
│   │   └── stock.py         # check_stock, decrement_stock, increment_stock
│   └── main.py              # entrypoint da API
├── migrations/
│   └── versions/
│       ├── 37d9af481f87_initial.py
│       └── c57cdf359e3d_add_users_table.py
├── tests/                   # vazio — a implementar (veja IMPL_GUIDE.md Fase 3.5)
├── .planning/
│   └── codebase/            # mapa do codebase gerado por análise estática
├── alembic.ini
├── docker-compose.yml
├── FIXES_GUIDE.md           # bugs e dívida técnica a corrigir antes de avançar
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
SECRET_KEY=troque-isso-por-uma-string-longa-e-aleatoria
DEBUG=False
JWT_LIFETIME_SECONDS=3600
MAX_IMAGE_SIZE_MB=5
```

`DEBUG` deve ser `True` ou `False` (booleano válido para o `python-decouple`).

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
incluindo as queries e mutations GraphQL.

## GraphQL

Endpoint: `POST /graphql` — interface interativa em `http://localhost:8000/graphql`

### Queries

| Query | Descrição |
|-------|-----------|
| `allProducts(limit, offset)` | Lista produtos |
| `product(id)` | Busca produto por ID |
| `allCategories` | Lista categorias |
| `category(id)` | Busca categoria por ID |
| `allBrands` | Lista marcas |
| `brand(id)` | Busca marca por ID |
| `allSales` | Lista vendas do usuário autenticado |
| `sale(id)` | Busca venda por ID |

### Mutations

| Mutation | Descrição |
|----------|-----------|
| `createProduct(input)` | Cria produto |
| `updateProduct(id, input)` | Atualiza produto |
| `deleteProduct(id)` | Remove produto |
| `createCategory(input)` | Cria categoria |
| `deleteCategory(id)` | Remove categoria |
| `createBrand(input)` | Cria marca |
| `deleteBrand(id)` | Remove marca |
| `createSale(items)` | Cria venda (decrementa estoque atomicamente) |
| `deleteSale(id)` | Cancela venda (restaura estoque) |

### Exemplo rápido

```graphql
# Criar produto
mutation {
  createProduct(input: {
    name: "Camiseta Preta M"
    salePrice: 89.90
    costPrice: 35.00
    stock: 50
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
```

## Serviços de negócio

A camada de serviços em `app/services/` contém as regras críticas do domínio:

- **`create_sale`** — verifica estoque, decrementa e persiste todos os itens dentro de uma única transação.
  Se qualquer item falhar, a venda inteira é revertida.
- **`remove_sale`** — cancela a venda e restaura o estoque de cada item.
- **`check_stock`** / **`decrement_stock`** / **`increment_stock`** — operações individuais de estoque.

> Atenção: há uma race condition conhecida no check/decrement de estoque em requisições simultâneas.
> A correção está documentada em [`FIXES_GUIDE.md`](./FIXES_GUIDE.md) seção 1.3.

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
| [`FIXES_GUIDE.md`](./FIXES_GUIDE.md) | Bugs, dívida técnica e segurança a corrigir antes de avançar |
| [`IMPL_GUIDE.md`](./IMPL_GUIDE.md) | Passo a passo completo de implementação de cada fase |
| [`ROADMAP.md`](./ROADMAP.md) | Visão geral das fases do projeto |
| [`.planning/codebase/`](./.planning/codebase/) | Mapa do codebase (stack, arquitetura, convenções, concerns) |

## Próximos passos

1. Aplicar correções do [`FIXES_GUIDE.md`](./FIXES_GUIDE.md) (bugs críticos e segurança primeiro)
2. Implementar testes de serviços — Fase 3.5 do [`IMPL_GUIDE.md`](./IMPL_GUIDE.md)
3. Implementar testes das mutations GraphQL — Fase 4.6
4. Upload de imagens — Fase 5
5. Conectar frontend — Fase 6
