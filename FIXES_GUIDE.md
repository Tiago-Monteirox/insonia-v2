# Insonia v2 — Guia de Correções

> Corrija tudo aqui **antes** de continuar com novas features (Fase 5 em diante).
> Cada item tem arquivo, linha, problema e código pronto para aplicar.
> Ordem: Bugs primeiro → Tech Debt → Segurança → Performance.

---

## 1. Bugs Críticos

### 1.1 — `sale` query com `.where()` no lugar errado

**Arquivo:** `app/graphql/queries.py` (linhas 114–116)

**Problema:** `.where(Sale.id == id)` está sendo chamado no `selectinload()`, que não aceita filtro. O resultado é incorreto ou lança erro em runtime ao chamar `sale(id: X)`.

**Antes:**

```python
result = await db.execute(
    select(Sale).options(
        selectinload(Sale.items).where(Sale.id == id)
    )
)
```

**Depois:**

```python
result = await db.execute(
    select(Sale)
    .options(selectinload(Sale.items))
    .where(Sale.id == id)
)
```

---

### 1.2 — `scalar_one()` estoura 500 quando o registro não existe

**Arquivo:** `app/graphql/mutations.py` (linhas 55, 105, 127, 149, 171)

**Problema:** `scalar_one()` levanta `NoResultFound` do SQLAlchemy — o cliente recebe 500 em vez de uma mensagem útil ao tentar deletar ou atualizar um ID inexistente.

**Padrão a aplicar em todos os resolvers afetados:**

```python
# Antes
product = result.scalar_one()

# Depois
product = result.scalar_one_or_none()
if product is None:
    raise strawberry.exceptions.GraphQLError("Produto não encontrado")
```

Aplique o mesmo padrão para `Category`, `Brand`, e `Sale`:

```python
# update_product / delete_product
product = result.scalar_one_or_none()
if product is None:
    raise strawberry.exceptions.GraphQLError("Produto não encontrado")

# delete_category
category = result.scalar_one_or_none()
if category is None:
    raise strawberry.exceptions.GraphQLError("Categoria não encontrada")

# delete_brand
brand = result.scalar_one_or_none()
if brand is None:
    raise strawberry.exceptions.GraphQLError("Marca não encontrada")
```

---

### 1.3 — Race condition no check/decrement de estoque

**Arquivo:** `app/services/stock.py` (linhas 8–27), `app/services/sale.py`

**Problema:** `check_stock` faz um `SELECT` e `decrement_stock` faz um `UPDATE` separado. Com duas requisições simultâneas para o mesmo produto com estoque = 1, ambas passam no check e o estoque vai para -1.

**Solução — substituir os dois passos por um único `UPDATE ... RETURNING`:**

```python
# app/services/stock.py — substitua check_stock + decrement_stock por:
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product


async def decrement_stock_atomic(
    db: AsyncSession, product_id: int, quantity: int
) -> None:
    """Decrementa estoque atomicamente. Levanta ValueError se insuficiente."""
    result = await db.execute(
        update(Product)
        .where(Product.id == product_id, Product.stock >= quantity)
        .values(stock=Product.stock - quantity)
        .returning(Product.stock)
    )
    row = result.fetchone()
    if row is None:
        # Produto não existe ou estoque insuficiente — verifica qual
        check = await db.execute(
            select(Product.stock, Product.id).where(Product.id == product_id)
        )
        rec = check.fetchone()
        if rec is None:
            raise ValueError(f"Produto {product_id} não encontrado")
        raise ValueError(
            f"Estoque insuficiente para produto {product_id}: "
            f"{rec.stock} disponível, {quantity} solicitado"
        )
```

Atualize `app/services/sale.py` para usar a nova função:

```python
# app/services/sale.py — substituir check_stock + decrement_stock por:
from app.services.stock import decrement_stock_atomic, increment_stock

async def create_sale(db: AsyncSession, user_id: int, items: list[ItemInput]) -> Sale:
    async with db.begin():
        sale = Sale(user_id=user_id)
        db.add(sale)
        await db.flush()

        total_amount = Decimal("0")
        total_profit = Decimal("0")

        for item in items:
            # Um único UPDATE atômico — sem janela de race condition
            await decrement_stock_atomic(db, item.product_id, item.quantity)

            iv = SaleItem(
                sale_id=sale.id,
                product_id=item.product_id,
                quantity=item.quantity,
                sale_price=item.sale_price,
                cost_price=item.cost_price,
            )
            db.add(iv)

            subtotal = item.sale_price * item.quantity
            total_cost = item.cost_price * item.quantity
            total_amount += subtotal
            total_profit += subtotal - total_cost

        sale.total_amount = total_amount
        sale.total_profit = total_profit

    return sale
```

No mutation `create_sale`, traduza `ValueError` para erro GraphQL:

```python
# app/graphql/mutations.py — create_sale
try:
    sale = await svc_create_sale(db, user.id, items_input)
except ValueError as e:
    raise strawberry.exceptions.GraphQLError(str(e))
```

---

## 2. Tech Debt

### 2.1 — Imports inline dentro de resolvers

**Arquivo:** `app/graphql/mutations.py` (linhas 46–48, 182)

**Problema:** `select`, `Product` e `remove_sale` são importados dentro do corpo das funções. Os módulos já estão disponíveis no topo do arquivo — os imports inline são redundantes e escondem dependências.

**Solução:** Mova todos os imports para o topo do arquivo e remova as linhas duplicadas dentro das funções.

```python
# Topo de app/graphql/mutations.py — certifique que estão aqui:
from decimal import Decimal

import strawberry
from sqlalchemy import select
from slugify import slugify
from strawberry.types import Info

from app.graphql.inputs import BrandInput, CategoryInput, ProductInput
from app.graphql.queries import product_model_to_type
from app.graphql.types import BrandType, CategoryType, ProductType
from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product
from app.models.sale import Sale
from app.services.sale import ItemInput, create_sale as svc_create_sale, remove_sale
from app.services.stock import increment_stock
```

Remova os `import` que aparecem dentro de `create_sale` (linhas 46–48) e dentro de `delete_sale` (linha 182).

---

### 2.2 — Lógica de negócio duplicada em `create_sale` (mutation)

**Arquivo:** `app/graphql/mutations.py` (linhas 50–64), `app/services/sale.py`

**Problema:** A mutation busca os preços dos produtos diretamente no banco antes de chamar o serviço. Isso duplica a responsabilidade — quem deve saber como montar um `ItemInput` é o serviço, não o resolver.

**Solução — mover o lookup de preço para o serviço:**

```python
# app/services/sale.py — novo dataclass de entrada (sem preços)
@dataclass
class SaleItemInput:
    """Dados de entrada de um item de venda vindos do resolver."""
    product_id: int
    quantity: int


async def create_sale(
    db: AsyncSession, user_id: int, items: list[SaleItemInput]
) -> Sale:
    """Busca preços, verifica estoque e cria a venda atomicamente."""
    async with db.begin():
        sale = Sale(user_id=user_id)
        db.add(sale)
        await db.flush()

        total_amount = Decimal("0")
        total_profit = Decimal("0")

        for item in items:
            # Buscar preços dentro do serviço — resolver não precisa saber disso
            result = await db.execute(
                select(Product.sale_price, Product.cost_price)
                .where(Product.id == item.product_id)
            )
            row = result.fetchone()
            if row is None:
                raise ValueError(f"Produto {item.product_id} não encontrado")

            await decrement_stock_atomic(db, item.product_id, item.quantity)

            iv = SaleItem(
                sale_id=sale.id,
                product_id=item.product_id,
                quantity=item.quantity,
                sale_price=row.sale_price,
                cost_price=row.cost_price,
            )
            db.add(iv)

            subtotal = row.sale_price * item.quantity
            total_cost = row.cost_price * item.quantity
            total_amount += subtotal
            total_profit += subtotal - total_cost

        sale.total_amount = total_amount
        sale.total_profit = total_profit

    return sale
```

A mutation fica limpa — só repassa os IDs e quantidades:

```python
# app/graphql/mutations.py — create_sale mutation
@strawberry.mutation
async def create_sale(self, info: Info, items: list[SaleItemInput]) -> SaleResult:
    db = info.context["db"]
    user = info.context["user"]

    items_input = [
        SaleItemInput(product_id=i.product_id, quantity=i.quantity)
        for i in items
    ]

    try:
        sale = await svc_create_sale(db, user.id, items_input)
    except ValueError as e:
        raise strawberry.exceptions.GraphQLError(str(e))

    return SaleResult(
        id=sale.id,
        total_amount=float(sale.total_amount),
        total_profit=float(sale.total_profit),
    )
```

---

### 2.3 — Faltam mutations `update_category` e `update_brand`

**Arquivo:** `app/graphql/mutations.py`

**Problema:** Existe `update_product` mas não existe `update_category` nem `update_brand`. Para renomear uma categoria hoje é preciso deletar e recriar, quebrando a integridade referencial (produtos apontando para a categoria antiga).

**Solução — adicionar as duas mutations:**

```python
# app/graphql/mutations.py — adicionar à classe Mutation

@strawberry.mutation
async def update_category(
    self, info: Info, id: int, input: CategoryInput
) -> CategoryType:
    """Atualiza o nome de uma categoria existente."""
    db = info.context["db"]
    result = await db.execute(select(Category).where(Category.id == id))
    category = result.scalar_one_or_none()
    if category is None:
        raise strawberry.exceptions.GraphQLError("Categoria não encontrada")
    category.name = input.name
    category.slug = slugify(input.name)
    await db.commit()
    await db.refresh(category)
    return CategoryType(id=category.id, name=category.name, slug=category.slug)


@strawberry.mutation
async def update_brand(
    self, info: Info, id: int, input: BrandInput
) -> BrandType:
    """Atualiza o nome de uma marca existente."""
    db = info.context["db"]
    result = await db.execute(select(Brand).where(Brand.id == id))
    brand = result.scalar_one_or_none()
    if brand is None:
        raise strawberry.exceptions.GraphQLError("Marca não encontrada")
    brand.name = input.name
    brand.slug = slugify(input.name)
    await db.commit()
    await db.refresh(brand)
    return BrandType(id=brand.id, name=brand.name, slug=brand.slug)
```

---

### 2.4 — `SlugMixin` não atualiza o slug quando o nome muda

**Arquivo:** `app/models/mixins.py` (linha 7)

**Problema:** A condição `if target.name and not target.slug` impede a regeneração do slug em updates. `update_product` contorna isso manualmente com `slugify(input.name)`, mas `update_category` e `update_brand` (que serão adicionados no item 2.3) não têm esse workaround — resultado: slug fica desatualizado após renomear.

**Solução — separar handlers de insert e update:**

```python
# app/models/mixins.py
from sqlalchemy import event
from slugify import slugify


def _set_slug_on_insert(mapper, connection, target):
    """Gera slug apenas na inserção, se ainda não foi definido."""
    if target.name and not target.slug:
        target.slug = slugify(target.name)


def _set_slug_on_update(mapper, connection, target):
    """Regenera slug sempre que o nome mudar em um update."""
    if target.name:
        target.slug = slugify(target.name)


class SlugMixin:
    """Mixin que mantém o slug sincronizado com o name automaticamente."""

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        event.listen(cls, "before_insert", _set_slug_on_insert)
        event.listen(cls, "before_update", _set_slug_on_update)
```

Com isso, o `slugify(input.name)` manual em `update_product` na mutation pode ser removido — o mixin cuida disso. Mas não há problema em deixá-lo — ele só vai setar o mesmo valor.

---

### 2.5 — Migration vazia `c57cdf359e3d`

**Arquivo:** `migrations/versions/c57cdf359e3d_add_users_table.py`

**Problema:** Os métodos `upgrade()` e `downgrade()` estão vazios. A tabela `users` foi criada na migration anterior `37d9af481f87`. Essa migration é ruído na cadeia.

**Solução:**

Se essa migration **nunca foi aplicada** em nenhum ambiente (verifique com `uv run alembic current`):

```bash
# Verificar se foi aplicada
uv run alembic current

# Se a head for c57cdf359e3d ou uma revisão posterior, NÃO delete ainda.
# Se a última aplicada for 37d9af481f87, pode deletar com segurança:
rm migrations/versions/c57cdf359e3d_add_users_table.py
```

Se **já foi aplicada**, marque como squashada atualizando o `down_revision` da próxima migration para apontar direto para `37d9af481f87`, e delete o arquivo vazio.

---

### 2.6 — `remove_sale` levanta `HTTPException` na camada de serviço

**Arquivo:** `app/services/sale.py` (linhas 64–66)

**Problema:** Serviços não devem conhecer HTTP. Se `remove_sale` for chamado de um teste unitário ou background task sem contexto HTTP, a exceção não faz sentido.

**Solução — levantar `ValueError` no serviço e traduzir no resolver:**

```python
# app/services/sale.py — remove_sale
async def remove_sale(db: AsyncSession, sale_id: int) -> None:
    async with db.begin():
        result = await db.execute(
            select(Sale)
            .options(selectinload(Sale.items))
            .where(Sale.id == sale_id)
        )
        sale = result.scalar_one_or_none()
        if sale is None:
            raise ValueError(f"Venda {sale_id} não encontrada")  # sem HTTPException

        for item in sale.items:
            await increment_stock(db, item.product_id, item.quantity)

        await db.delete(sale)
```

```python
# app/graphql/mutations.py — delete_sale
@strawberry.mutation
async def delete_sale(self, info: Info, id: int) -> bool:
    db = info.context["db"]
    try:
        await remove_sale(db, id)
    except ValueError as e:
        raise strawberry.exceptions.GraphQLError(str(e))
    return True
```

---

## 3. Segurança

### 3.1 — SQL echo em produção

**Arquivo:** `app/core/database.py` (linha 6)

**Problema:** `echo=True` loga todas as queries SQL (incluindo IDs de usuário e valores de venda) no stdout em produção.

```python
# Antes
engine = create_async_engine(DATABASE_URL, echo=True)

# Depois
from app.core.config import DEBUG
engine = create_async_engine(DATABASE_URL, echo=DEBUG)
```

---

### 3.2 — Secrets separados para reset e verificação

**Arquivo:** `app/core/auth.py` (linhas 24–25), `.env`

**Problema:** JWT de autenticação, reset de senha e verificação de e-mail usam o mesmo `SECRET_KEY`. Um token vazado de um tipo pode ser replayed em outro contexto.

**Adicione ao `.env`:**

```ini
RESET_PASSWORD_SECRET=outra-string-longa-aleatoria-aqui
VERIFICATION_SECRET=mais-uma-string-longa-aleatoria-aqui
```

**Atualize `app/core/config.py`:**

```python
RESET_PASSWORD_SECRET: str = config("RESET_PASSWORD_SECRET", default=SECRET_KEY)
VERIFICATION_SECRET: str = config("VERIFICATION_SECRET", default=SECRET_KEY)
```

**Atualize `app/core/auth.py`:**

```python
from app.core.config import RESET_PASSWORD_SECRET, VERIFICATION_SECRET

fastapi_users = FastAPIUsers[User, int](
    get_user_db,
    [auth_backend],
    reset_password_token_secret=RESET_PASSWORD_SECRET,
    verification_token_secret=VERIFICATION_SECRET,
)
```

---

### 3.3 — `all_sales` expõe vendas de todos os usuários

**Arquivo:** `app/graphql/queries.py` (linhas 104–108)

**Problema:** Qualquer usuário autenticado pode chamar `allSales` e ver as vendas (com `user_id`) de todos os outros usuários.

**Solução — filtrar pela sessão do usuário atual:**

```python
@strawberry.field
async def all_sales(self, info: Info) -> list[SaleType]:
    """Retorna apenas as vendas do usuário autenticado."""
    db = info.context["db"]
    user = info.context["user"]
    result = await db.execute(
        select(Sale)
        .options(selectinload(Sale.items))
        .where(Sale.user_id == user.id)  # escopo pelo usuário
    )
    return [sale_model_to_type(s) for s in result.scalars()]
```

Considere também remover `user_id` de `SaleType` em `app/graphql/types.py` — o frontend não precisa desse campo se as vendas já são filtradas pelo usuário logado.

---

### 3.4 — Mutations sem verificação de posse

**Arquivo:** `app/graphql/mutations.py`

**Problema:** Qualquer usuário autenticado pode deletar a venda de outro usuário, ou deletar/atualizar qualquer produto/categoria/marca.

**Solução mínima para `delete_sale`:**

```python
@strawberry.mutation
async def delete_sale(self, info: Info, id: int) -> bool:
    db = info.context["db"]
    user = info.context["user"]

    result = await db.execute(select(Sale).where(Sale.id == id))
    sale = result.scalar_one_or_none()
    if sale is None:
        raise strawberry.exceptions.GraphQLError("Venda não encontrada")
    if sale.user_id != user.id and not user.is_superuser:
        raise strawberry.exceptions.GraphQLError("Sem permissão para deletar esta venda")

    try:
        await remove_sale(db, id)
    except ValueError as e:
        raise strawberry.exceptions.GraphQLError(str(e))
    return True
```

**Para mutations de produto/categoria/marca** — restrinja a superusuários:

```python
# Padrão a aplicar em create_product, update_product, delete_product,
# create_category, update_category, delete_category, create_brand, update_brand, delete_brand:
user = info.context["user"]
if not user.is_superuser:
    raise strawberry.exceptions.GraphQLError("Apenas administradores podem realizar esta operação")
```

---

### 3.5 — Rate limiting nos endpoints de auth

**Arquivo:** `app/main.py`

**Problema:** `POST /auth/register` e `POST /auth/login` não têm throttling — vulneráveis a brute force.

```bash
uv add slowapi
```

```python
# app/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

```python
# app/routers/auth_rate_limit.py (wrapper para as rotas de auth)
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

limiter = Limiter(key_func=get_remote_address)

# Aplique o decorator nas rotas de login/register do fastapi-users
# ou adicione um middleware de rate limit global no prefixo /auth
```

> **Atenção:** `fastapi-users` gera as rotas automaticamente, então o caminho mais simples é um middleware de rate limit aplicado ao prefixo `/auth` no `main.py`.

---

## 4. Performance

### 4.1 — Paginação nas queries de lista

**Arquivo:** `app/graphql/queries.py`

**Problema:** `all_products`, `all_sales`, `all_categories`, `all_brands` retornam todos os registros sem limite.

**Solução — adicionar `limit` e `offset` a cada resolver de lista:**

```python
@strawberry.field
async def all_products(
    self, info: Info, limit: int = 100, offset: int = 0
) -> list[ProductType]:
    """Retorna produtos com paginação. Padrão: primeiros 100."""
    db = info.context["db"]
    result = await db.execute(
        select(Product).limit(limit).offset(offset)
    )
    return [product_model_to_type(p) for p in result.scalars()]


@strawberry.field
async def all_sales(
    self, info: Info, limit: int = 50, offset: int = 0
) -> list[SaleType]:
    """Retorna vendas do usuário autenticado com paginação."""
    db = info.context["db"]
    user = info.context["user"]
    result = await db.execute(
        select(Sale)
        .options(selectinload(Sale.items))
        .where(Sale.user_id == user.id)
        .order_by(Sale.sale_date.desc())
        .limit(limit)
        .offset(offset)
    )
    return [sale_model_to_type(s) for s in result.scalars()]
```

Aplique o mesmo padrão para `all_categories` e `all_brands`.

---

## 5. Ordem de Execução Recomendada

Execute nesta ordem para minimizar retrabalho:

| # | Item | Arquivo | Risco se ignorado |
|---|------|---------|-------------------|
| 1 | Bug: `sale` query | `queries.py` | Query retorna errado em prod |
| 2 | Bug: `scalar_one()` | `mutations.py` | 500 ao chamar delete/update com ID inválido |
| 3 | Bug: race condition stock | `stock.py`, `sale.py` | Estoque negativo em prod |
| 4 | Segurança: `echo=True` | `database.py` | Logs de dados sensíveis em prod |
| 5 | Segurança: ownership mutation | `mutations.py` | Qualquer usuário deleta venda de outro |
| 6 | Segurança: all_sales scope | `queries.py` | Vazamento de dados de outros usuários |
| 7 | Tech: imports inline | `mutations.py` | Limpeza, sem risco funcional |
| 8 | Tech: lógica duplicada create_sale | `mutations.py`, `sale.py` | Preço errado se pricing logic mudar |
| 9 | Tech: SlugMixin update | `mixins.py` | Slug diverge do nome após rename |
| 10 | Tech: update_category / update_brand | `mutations.py` | Client tem que deletar/recriar para renomear |
| 11 | Tech: remove_sale HTTPException | `sale.py` | Explode em contexto não-HTTP |
| 12 | Segurança: secrets separados | `auth.py`, `.env` | Replay attack entre tipos de token |
| 13 | Segurança: rate limiting | `main.py` | Brute force em /auth/login |
| 14 | Performance: paginação | `queries.py` | Queries lentas com catálogo grande |
| 15 | Tech: migration vazia | `migrations/` | Confusão no histórico de migrations |

---

## 6. Testes para Validar as Correções

Após cada correção, rode (ou escreva) o teste correspondente:

```python
# tests/test_bugs.py

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_sale_query_returns_correct_sale(client, sale_fixture):
    """Garante que sale(id) retorna a venda certa e não estoura erro."""
    response = await client.post("/graphql", json={
        "query": f"{{ sale(id: {sale_fixture.id}) {{ id totalAmount }} }}"
    })
    data = response.json()
    assert "errors" not in data
    assert data["data"]["sale"]["id"] == sale_fixture.id


@pytest.mark.asyncio
async def test_delete_nonexistent_product_returns_graphql_error(client):
    """scalar_one_or_none: deletar ID inexistente retorna erro GraphQL, não 500."""
    response = await client.post("/graphql", json={
        "query": "mutation { deleteProduct(id: 999999) }"
    })
    data = response.json()
    assert response.status_code == 200  # GraphQL sempre retorna 200
    assert "errors" in data
    assert "não encontrado" in data["errors"][0]["message"].lower()


@pytest.mark.asyncio
async def test_stock_race_condition(client, product_fixture):
    """Duas vendas simultâneas com estoque=1: apenas uma deve ser aprovada."""
    import asyncio

    async def make_sale():
        return await client.post("/graphql", json={
            "query": f"""
                mutation {{
                    createSale(items: [{{ productId: {product_fixture.id}, quantity: 1 }}]) {{
                        id
                    }}
                }}
            """
        })

    results = await asyncio.gather(make_sale(), make_sale(), return_exceptions=True)
    successes = [r for r in results if "errors" not in r.json().get("data", {}).get("createSale", {}) or r.json().get("data", {}).get("createSale")]
    errors = [r for r in results if "errors" in r.json()]

    assert len(errors) >= 1, "Pelo menos uma das vendas deve ser rejeitada por estoque insuficiente"
```

---

*Guia de correções — 2026-04-26*
