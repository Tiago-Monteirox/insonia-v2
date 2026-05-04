# Insonia v2

Sistema de gestão de loja e ponto de venda. Backend em FastAPI + GraphQL, frontend em React (CDN) com design system próprio.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework web | FastAPI |
| ORM | SQLAlchemy 2.x async |
| Banco de dados | PostgreSQL 16 |
| GraphQL | Strawberry |
| Auth | fastapi-users + JWT |
| Migrations | Alembic |
| Gerenciador de pacotes | uv |
| Frontend (admin) | React 18 + Vite + React Router v6 |
| Frontend (loja) | React 18 (CDN) + Babel standalone — UI kit estático |

## Estrutura

```text
insonia-v2/
├── app/
│   ├── core/
│   │   ├── auth.py             # fastapi-users, JWT strategy
│   │   ├── config.py           # variáveis de ambiente via python-decouple
│   │   └── database.py         # engine async, session factory, Base
│   ├── graphql/
│   │   ├── inputs.py           # ProductInput, CategoryInput, BrandInput, VariationInputs
│   │   ├── mutations.py        # CRUD de produto, categoria, marca, variação e venda
│   │   ├── queries.py          # listagem paginada, agregações de dashboard
│   │   ├── schema.py           # montagem do schema + contexto (db, user)
│   │   └── types.py            # tipos GraphQL do domínio
│   ├── models/
│   │   ├── brand.py
│   │   ├── category.py
│   │   ├── mixins.py           # SlugMixin (auto-slug via eventos SQLAlchemy)
│   │   ├── product.py          # Product + ProductImage
│   │   ├── sale.py             # Sale + SaleItem
│   │   ├── user.py
│   │   └── variation.py        # VariationName, VariationValue, Variation
│   ├── routers/
│   │   ├── auth_rate_limit.py  # AuthRateLimitMiddleware (sliding window por IP)
│   │   └── images.py           # upload de imagens de produto
│   ├── schemas/
│   │   └── user.py             # UserRead, UserCreate, UserUpdate
│   ├── services/
│   │   ├── sale.py             # create_sale (atômico), remove_sale
│   │   └── stock.py            # decrement_stock_atomic, increment_stock
│   └── main.py                 # entrypoint — rotas, middlewares, static files
├── insonia-frontend/
│   ├── insonia-design-system/vite-export/   # admin panel — app Vite principal
│   │   ├── src/
│   │   │   ├── lib/api.js          # cliente GraphQL + auth (JWT)
│   │   │   ├── components/         # AppLayout (Sidebar + Topbar), ProtectedRoute
│   │   │   ├── pages/              # Dashboard, PDV, Produtos, Categorias, Marcas,
│   │   │   │                       # Variacoes, Historico, Estatisticas
│   │   │   ├── pages/auth/         # Login, ForgotPassword, ResetPassword, OAuthCallback
│   │   │   └── styles/             # colors_and_type.css, app.css
│   │   ├── .env                    # VITE_API_BASE=http://localhost:8000
│   │   └── package.json
│   ├── ui_kits/insonia_app/    # kit de UI do admin (CDN/Babel, referência de design)
│   ├── ui_kits/insonia_store/  # loja e-commerce (CDN/Babel, UI kit estático)
│   ├── colors_and_type.css     # variáveis de design system (fonte do kit)
│   ├── AUTH_SCREENS_SPEC.md    # spec das telas de auth
│   └── README.md               # design system — cores, tipografia, componentes
├── migrations/
├── tests/
│   ├── conftest.py
│   ├── test_stock.py
│   ├── test_sale_service.py
│   ├── test_graphql_mutations.py
│   ├── test_variations.py
│   ├── test_aggregation_queries.py
│   ├── test_auth.py
│   └── test_e2e_pdv.py
├── alembic.ini
├── docker-compose.yml
├── IMPL_GUIDE.md               # guia de implementação das fases 0–9
├── WIRING_GUIDE.md             # guia de wiring frontend ↔ backend (fases 1–8)
├── TODO.md                     # tarefas pendentes
└── ROADMAP.md
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

Backend disponível em:

- `http://localhost:8000/health`
- `http://localhost:8000/docs` — Swagger UI
- `http://localhost:8000/graphql` — GraphiQL

```bash
# 5. Subir o admin panel Vite (em outro terminal)
cd insonia-frontend/insonia-design-system/vite-export
npm install   # apenas na primeira vez
npm run dev
```

| Interface | URL | Descrição |
|-----------|-----|-----------|
| Admin panel | `http://localhost:5173` | Dashboard, PDV, CRUD completo — dados reais |
| E-commerce (UI kit) | `http://localhost:5500/ui_kits/insonia_store/` | Loja estática — requer `python3 -m http.server 5500` na pasta `insonia-frontend/` |

## Variáveis de ambiente

Crie um `.env` na raiz:

```env
DATABASE_URL=postgresql+asyncpg://insonia:insonia@localhost:5432/insonia
SECRET_KEY=string-longa-e-aleatoria
RESET_PASSWORD_SECRET=outra-string-longa-aleatoria
VERIFICATION_SECRET=mais-uma-string-longa-aleatoria
DEBUG=False
JWT_LIFETIME_SECONDS=3600
MAX_IMAGE_SIZE_MB=5
```

`DEBUG=True` ativa o log de queries SQL no stdout — nunca use em produção.

## Criar o primeiro usuário

Com o backend rodando, via Swagger (`/docs`) ou curl:

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "voce@insonia.com", "username": "voce", "password": "sua-senha"}'
```

## Autenticação

Todas as rotas GraphQL exigem JWT. Envie no header:

```
Authorization: Bearer <token>
```

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Cadastro |
| POST | `/auth/login` | Login — retorna JWT |
| POST | `/auth/logout` | Logout |
| POST | `/auth/forgot-password` | Envia e-mail de recuperação |
| POST | `/auth/reset-password` | Redefine senha com token |
| GET | `/users/me` | Dados do usuário logado |
| PATCH | `/users/me` | Atualizar perfil |

Os endpoints `/auth/*` têm rate limiting de 10 requisições por minuto por IP.

## GraphQL

### Queries

| Query | Parâmetros | Descrição |
|-------|------------|-----------|
| `allProducts(limit, offset)` | `limit=100` | Lista produtos paginados |
| `product(id)` | — | Busca produto por ID |
| `allCategories(limit, offset)` | `limit=20` | Lista categorias |
| `allBrands(limit, offset)` | `limit=20` | Lista marcas |
| `brand(id)` | — | Busca marca por ID |
| `allSales(limit, offset, dateFrom, dateTo)` | `limit=50` | Vendas do usuário, filtráveis por data |
| `sale(id)` | — | Busca venda por ID |
| `allVariationNames` | — | Dimensões de variação com valores |
| `salesSummary(dateFrom, dateTo)` | últimos 30 dias | Faturamento, lucro, contagem, ticket médio |
| `dailyRevenue(dateFrom, dateTo)` | últimos 30 dias | Faturamento por dia (para gráfico) |
| `topProducts(limit)` | `limit=5` | Produtos com maior volume de vendas |

Datas no formato `YYYY-MM-DD`.

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
| `createVariationName(input)` | superuser | Cria dimensão de variação |
| `addVariationValue(input)` | superuser | Adiciona valor a uma dimensão |
| `deleteVariationName(id)` | superuser | Remove dimensão e seus valores |
| `deleteVariationValue(id)` | superuser | Remove valor de variação |
| `createSale(items)` | autenticado | Cria venda — decrementa estoque atomicamente |
| `deleteSale(id)` | dono ou superuser | Cancela venda — restaura estoque |

### Exemplo rápido

```graphql
# Registrar venda
mutation {
  createSale(items: [{ productId: 1, quantity: 2 }]) {
    id totalAmount totalProfit
  }
}

# Dashboard — buscar tudo em uma request
{
  salesSummary { totalRevenue totalProfit saleCount avgTicket }
  dailyRevenue { date total }
  topProducts(limit: 5) { name unitsSold revenue }
  allSales(limit: 5) { id saleDate totalAmount }
}
```

## Upload de imagens

```
POST /produtos/{product_id}/images
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

Formatos aceitos: `image/jpeg`, `image/png`, `image/webp`. Tamanho máximo: `MAX_IMAGE_SIZE_MB` (padrão 5 MB).

Arquivos salvos em `media/imagens/`. Servidos em `GET /media/{filename}`.

## Serviços de negócio

- **`create_sale`** — busca preços do banco, decrementa estoque via `UPDATE ... RETURNING` e persiste itens em transação única. Rollback total se qualquer item falhar.
- **`remove_sale`** — cancela venda e restaura estoque de cada item.
- **`decrement_stock_atomic`** — `UPDATE ... WHERE stock >= quantity` elimina race condition em vendas simultâneas.

## Banco de dados

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

```bash
uv run alembic revision --autogenerate -m "descricao"  # nova migration
uv run alembic upgrade head                             # aplicar
uv run alembic downgrade -1                             # reverter última
uv run alembic current                                  # estado atual
```

## Testes

```bash
# Criar banco de testes (uma vez)
docker compose exec db psql -U insonia -c "CREATE DATABASE insonia_test;"

# Rodar todos
uv run pytest tests/ -v

# Com cobertura
uv run pytest tests/ --cov=app --cov-report=term-missing
```

| Arquivo | Cobertura |
|---------|-----------|
| `test_stock.py` | `decrement_stock_atomic`, `increment_stock`, `check_stock` |
| `test_sale_service.py` | `create_sale` (rollback em estoque insuficiente), `remove_sale` |
| `test_graphql_mutations.py` | CRUD de produto, categoria, marca e venda via GraphQL |
| `test_variations.py` | CRUD de dimensões e valores de variação via GraphQL |
| `test_aggregation_queries.py` | `salesSummary`, `dailyRevenue`, `topProducts`, filtro de data em `allSales` |
| `test_auth.py` | Register, login, rotas protegidas, token inválido |
| `test_e2e_pdv.py` | Fluxo completo PDV: criar → vender → cancelar → verificar estoque |

## Documentação

| Arquivo | Conteúdo |
|---------|----------|
| [`IMPL_GUIDE.md`](./IMPL_GUIDE.md) | Guia de implementação das fases 0–9 (setup ao deploy) |
| [`WIRING_GUIDE.md`](./WIRING_GUIDE.md) | Guia de wiring frontend ↔ backend (fases 1–8) |
| [`TODO.md`](./TODO.md) | Tarefas pendentes com gaps de backend identificados |
| [`ROADMAP.md`](./ROADMAP.md) | Visão geral das fases do projeto |
| [`insonia-frontend/AUTH_SCREENS_SPEC.md`](./insonia-frontend/AUTH_SCREENS_SPEC.md) | Spec das telas de auth (login, recuperação, Google OAuth) |
| [`insonia-frontend/README.md`](./insonia-frontend/README.md) | Design system — cores, tipografia, iconografia |
