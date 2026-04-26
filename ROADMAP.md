# Insonia v2 — Roadmap FastAPI

> Reconstrução completa do backend Insonia com FastAPI + Strawberry + SQLAlchemy + PostgreSQL.
> Frontend já construído em `/insonia-frontend/` — objetivo é conectar os dois.
> Criado em: 2026-04-19

---

## Stack Alvo

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Framework | FastAPI | API pura, async nativo, sem overhead de admin Django |
| GraphQL | Strawberry | Code-first, type hints nativos, melhor que graphene |
| ORM | SQLAlchemy 2.x (async) | Padrão de mercado, async, controle total |
| Migrations | Alembic | Par natural do SQLAlchemy |
| Banco | PostgreSQL + psycopg3 | Produção desde o início |
| Auth | fastapi-users | JWT + OAuth2, bem integrado com SQLAlchemy |
| Moeda | python-moneyed | Mesma lib do legado |
| Validação | Pydantic v2 | Nativo do FastAPI |
| Package manager | uv | Já em uso |
| Testes | pytest + pytest-asyncio + httpx | Async-first |
| Config | python-decouple | Secrets via .env |

---

## Fases

---

### Fase 0 — Setup do Projeto

**Objetivo:** repositório limpo com infraestrutura base funcionando.

**Tarefas:**

- [ ] Criar novo repositório `insonia-v2`
- [ ] Inicializar com `uv init`, configurar `pyproject.toml`
- [ ] Instalar dependências: fastapi, uvicorn, sqlalchemy, alembic, psycopg, strawberry-graphql, fastapi-users, python-moneyed, python-decouple, pydantic
- [ ] Estrutura de diretórios:

  ```
  insonia/
  ├── app/
  │   ├── core/          ← config, database, deps
  │   ├── models/        ← SQLAlchemy models
  │   ├── schemas/       ← Pydantic schemas (input/output)
  │   ├── graphql/       ← Strawberry types + resolvers
  │   ├── routers/       ← FastAPI routers (REST opcional)
  │   └── services/      ← lógica de negócio (estoque, totais)
  ├── migrations/        ← Alembic
  ├── tests/
  ├── .env
  └── main.py
  ```

- [ ] Configurar PostgreSQL local (Docker Compose ou instância direta)
- [ ] `.env` com DATABASE_URL, SECRET_KEY, DEBUG
- [ ] `main.py` com FastAPI app + lifespan

**Critério de aceitação:** `uvicorn app.main:app --reload` sobe sem erros. `/docs` responde.

---

### Fase 1 — Modelos e Migrations

**Objetivo:** todos os modelos do domínio criados e migrados no PostgreSQL.

**Tarefas:**

- [ ] Configurar SQLAlchemy async engine + session dependency
- [ ] Criar modelos (em `app/models/`):
  - [ ] `Categoria` — id, name, slug (auto)
  - [ ] `Marca` — id, name, slug (auto)
  - [ ] `Produto` — todos os campos, Money como Numeric(14,2) + currency string
  - [ ] `ProdutoImagem` — FK Produto, path da imagem
  - [ ] `NomeVariacao` — id, name unique
  - [ ] `ValorVariacao` — FK NomeVariacao, valor, unique_together
  - [ ] `Variacao` — FK Produto + ValorVariacao, unique_together
  - [ ] `Venda` — FK User, data_venda, valor_total, lucro_total
  - [ ] `ItemVenda` — FK Venda (CASCADE) + Produto (RESTRICT), quantidade, preco_venda, preco_custo
- [ ] Configurar Alembic (`alembic init`)
- [ ] Gerar e aplicar migration inicial
- [ ] Slug auto-gerado via python-slugify nos eventos SQLAlchemy (`@event.listens_for`)

**Critério de aceitação:** `alembic upgrade head` cria todas as tabelas. Relações corretas no `\d` do psql.

---

### Fase 2 — Autenticação

**Objetivo:** JWT auth funcionando com fastapi-users.

**Tarefas:**

- [ ] Configurar fastapi-users com SQLAlchemy backend
- [ ] Modelo User com campos: id, email, username, is_active, is_superuser
- [ ] Rotas: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /users/me`
- [ ] JWT com expiração configurável via `.env`
- [ ] Dependency `current_active_user` para proteger rotas
- [ ] Migration para tabela users

**Critério de aceitação:** fluxo register → login → token → `/users/me` funciona via `/docs`.

---

### Fase 3 — Serviços de Negócio

**Objetivo:** lógica de negócio isolada em serviços, sem depender de GraphQL ou REST.

**Tarefas:**

- [ ] `app/services/estoque.py`:
  - [ ] `verificar_estoque(db, produto_id, quantidade)` — lança exceção se insuficiente
  - [ ] `decrementar_estoque(db, produto_id, quantidade)` — atômico
  - [ ] `incrementar_estoque(db, produto_id, quantidade)` — atômico (rollback de venda)
- [ ] `app/services/venda.py`:
  - [ ] `calcular_totais(db, venda_id)` — recalcula e persiste valor_total + lucro_total
  - [ ] `criar_venda(db, usuario_id, itens)` — transação atômica: cria Venda, cria ItemVendas, decrementa estoque, calcula totais
  - [ ] `remover_venda(db, venda_id)` — remove itens, incrementa estoque, remove venda
- [ ] `app/services/produto.py`:
  - [ ] `criar_produto(db, data)` — gera slug, valida precos
  - [ ] `atualizar_produto(db, id, data)`
- [ ] Todos os serviços usam `async with db.begin()` para transações

**Critério de aceitação:** testes unitários dos serviços passam com banco real (sem mock).

---

### Fase 4 — GraphQL (Strawberry)

**Objetivo:** schema GraphQL completo, espelhando o legado sem os bugs.

**Tarefas:**

- [ ] Configurar Strawberry com FastAPI (`strawberry.fastapi.GraphQLRouter`)
- [ ] Types (`app/graphql/types.py`):
  - [ ] `MoneyType` — amount (float), currency (str)
  - [ ] `CategoriaType`, `MarcaType`
  - [ ] `ProdutoType` — inclui precoVenda, precoCusto, precoVendaPromocional como MoneyType
  - [ ] `VendaType` — valorTotal, lucroTotal, itens, dataVenda
  - [ ] `ItemVendaType` — subtotal, lucro (resolvidos)
  - [ ] `UserType` — id, username, email
- [ ] Queries (`app/graphql/queries.py`):
  - [ ] `todos_produtos`, `produto(id)`
  - [ ] `todas_categorias`, `todas_marcas`
  - [ ] `total_vendas`, `vendas_por_id(id)`
- [ ] Mutations (`app/graphql/mutations.py`):
  - [ ] `criar_venda(input: CriarVendaInput)` — usa `venda.service.criar_venda()`
  - [ ] `criar_item_venda(venda_id, produto_id, quantidade)`
  - [ ] `remover_item_venda(item_id)`
  - [ ] `remover_venda(venda_id)`
- [ ] Auth: todas as mutations exigem usuário autenticado (Strawberry permission class)
- [ ] Montar em `main.py`: `app.include_router(graphql_app, prefix="/graphql")`

**Critério de aceitação:** todas as queries e mutations do legado funcionam em `/graphql`. GraphiQL disponível em dev.

---

### Fase 5 — Upload de Imagens

**Objetivo:** upload de múltiplas imagens por produto funcionando (limitação do legado Django resolvida).

**Tarefas:**

- [ ] Endpoint `POST /produtos/{id}/imagens` — aceita `List[UploadFile]` (multipart/form-data com múltiplos arquivos)
- [ ] Processar uploads em paralelo (`asyncio.gather`) — salvar cada arquivo e persistir registro no banco
- [ ] Validar cada arquivo: tipo MIME (`image/jpeg`, `image/png`, `image/webp`), tamanho máximo configurável via `.env`
- [ ] Retornar lista de URLs de todas as imagens criadas
- [ ] Endpoint `DELETE /produtos/{id}/imagens/{imagem_id}` — remove imagem individual
- [ ] Mutation GraphQL `adicionarImagensProduto(produto_id: ID!, imagens: [Upload!]!)` — múltiplos uploads via GraphQL multipart spec
- [ ] Servir imagens estáticas via FastAPI `StaticFiles`
- [ ] Configurar boto3 para S3 via `.env` (AWS_BUCKET, AWS_KEY, AWS_SECRET) para produção
- [ ] Query `produto(id)` retorna lista ordenada de imagens com `id` e `url`

**Critério de aceitação:** upload de 1–N imagens num único request persiste todos os registros. URLs acessíveis. Remoção individual funciona sem afetar as demais.

---

### Fase 6 — Wiring do Frontend (insonia_app)

**Objetivo:** substituir `data.js` do admin por chamadas reais ao backend.

**Tarefas:**

- [ ] Definir contrato de API (quais queries/mutations cada tela consome)
- [ ] Dashboard — query de totais de vendas, lucro, top produtos
- [ ] PDV — query de produtos com estoque, mutation `criarVenda`
- [ ] Produtos — query `todosProdutos`, mutations criar/editar/deletar produto
- [ ] Histórico — query `totalVendas` com filtro de período
- [ ] Login — mutation de autenticação, armazenar JWT no localStorage
- [ ] Configurar CORS no FastAPI para origem do frontend
- [ ] Adicionar interceptor de auth (header `Authorization: Bearer {token}`)

**Critério de aceitação:** fluxo completo do PDV funciona no browser sem erros — login, visualizar produtos, criar venda, ver histórico.

---

### Fase 7 — Wiring do Frontend (insonia_store)

**Objetivo:** loja virtual conectada ao backend.

**Tarefas:**

- [ ] Home — query de produtos (lançamentos, promoções com preco_venda_promocional)
- [ ] PDP — query `produto(id)` com variações e imagens
- [ ] Cart — lógica de carrinho no frontend (localStorage), checkout via mutation `criarVenda`
- [ ] Definir usuário "cliente" vs usuário "operador" (roles ou tabelas separadas)

**Critério de aceitação:** fluxo home → produto → carrinho → checkout persiste venda no banco.

---

### Fase 8 — Testes e Qualidade

**Objetivo:** cobertura de testes razoável nos caminhos críticos.

**Tarefas:**

- [ ] Setup pytest-asyncio + httpx AsyncClient
- [ ] Testes de serviço: estoque (decremento, rollback), calcular_totais, criar_venda atômica
- [ ] Testes de integração GraphQL: criar_venda, remover_venda, verificar_estoque
- [ ] Testes de auth: register, login, rota protegida sem token retorna 401
- [ ] Testes de validação: quantidade negativa, estoque insuficiente, preco_venda < preco_custo
- [ ] CI básico (GitHub Actions): lint + tests no push

**Critério de aceitação:** `pytest` passa. Caminhos de erro retornam códigos corretos.

---

### Fase 9 — Deploy

**Objetivo:** projeto rodando em produção.

**Tarefas:**

- [ ] `Dockerfile` para a aplicação FastAPI
- [ ] `docker-compose.yml` (app + postgres + nginx)
- [ ] Configurar variáveis de ambiente de produção
- [ ] Alembic migrations no startup do container
- [ ] HTTPS via Nginx + Let's Encrypt (ou Caddy)
- [ ] Logs estruturados (JSON) com nível configurável
- [ ] Health check endpoint `GET /health`

**Critério de aceitação:** `docker compose up` sobe tudo. `/health` responde 200. Frontend conecta ao backend em produção.

---

## Decisões pendentes

| Decisão | Opções | Status |
|---------|--------|--------|
| REST API manter? | Sim (FastAPI routers) / Não (só GraphQL) | Em aberto |
| Storage de imagens | Local / S3 | Fase 5 decide |
| Frontend build tool | Manter CDN / Migrar para Vite | Em aberto |
| Roles de usuário | Campo is_staff / Tabelas separadas | Fase 6/7 decide |

---

## Ordem sugerida de execução

```
0 (Setup) → 1 (Models) → 2 (Auth) → 3 (Services) → 4 (GraphQL)
→ 5 (Imagens) → 6 (Wiring App) → 7 (Wiring Store) → 8 (Testes) → 9 (Deploy)
```

Fases 1–4 são pré-requisito para tudo. Fases 5–7 podem ser feitas em paralelo depois da Fase 4.
