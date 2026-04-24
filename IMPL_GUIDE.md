# Insonia v2 — Guia de Implementação Detalhado

> Referência: [ROADMAP.md](./ROADMAP.md)
> Público: quem nunca usou FastAPI antes.
> Convenção: comandos de terminal começam com `$`. Blocos de código são os arquivos reais a criar.

---

## Fase 0 — Setup do Projeto

> **Resposta direta:** O FastAPI NÃO cria diretórios. Você cria tudo na mão (ou com `mkdir`). O FastAPI é só uma biblioteca Python — sem CLI de scaffold como Django tem (`django-admin startproject`).

### 0.1 — Criar o repositório

```bash
$ mkdir insonia-v2
$ cd insonia-v2
$ git init
$ uv init .
```

`uv init .` cria `pyproject.toml` e `.python-version` no diretório atual. Edite `pyproject.toml` para definir o nome do projeto:

```toml
# pyproject.toml
[project]
name = "insonia-v2"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []
```

### 0.2 — Instalar dependências

```bash
$ uv add fastapi "uvicorn[standard]" sqlalchemy asyncpg alembic \
         "strawberry-graphql[fastapi]" "fastapi-users[sqlalchemy]" \
         python-moneyed python-decouple python-slugify pydantic psycopg

$ uv add --dev pytest pytest-asyncio httpx
```

Após rodar isso, `uv` cria `.venv/` e `uv.lock` automaticamente. Não precisa ativar o virtualenv — use sempre `uv run` ou `uv run python`.

### 0.3 — Criar a estrutura de diretórios

Você cria isso na mão. Copie e cole no terminal:

```bash
$ mkdir -p app/core app/models app/schemas app/graphql app/routers app/services
$ mkdir -p migrations tests
$ touch app/__init__.py
$ touch app/core/__init__.py
$ touch app/models/__init__.py
$ touch app/schemas/__init__.py
$ touch app/graphql/__init__.py
$ touch app/routers/__init__.py
$ touch app/services/__init__.py
$ touch main.py
$ touch .env
$ touch .gitignore
```

Resultado esperado:
```
insonia-v2/
├── app/
│   ├── __init__.py
│   ├── core/
│   │   └── __init__.py
│   ├── models/
│   │   └── __init__.py
│   ├── schemas/
│   │   └── __init__.py
│   ├── graphql/
│   │   └── __init__.py
│   ├── routers/
│   │   └── __init__.py
│   └── services/
│       └── __init__.py
├── migrations/
├── tests/
├── main.py
├── .env
└── pyproject.toml
```

### 0.4 — PostgreSQL via Docker Compose

Crie `docker-compose.yml` na raiz do projeto:

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: insonia
      POSTGRES_USER: insonia
      POSTGRES_PASSWORD: insonia
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Para subir o banco:
```bash
$ docker compose up -d db
```

Para verificar que está rodando:
```bash
$ docker compose ps
```

### 0.5 — Arquivo `.env`

```ini
# .env
DATABASE_URL=postgresql+asyncpg://insonia:insonia@localhost:5432/insonia
SECRET_KEY=troque-isso-por-uma-string-longa-e-aleatoria
DEBUG=True
JWT_LIFETIME_SECONDS=3600
MAX_IMAGE_SIZE_MB=5
```

Adicione `.env` ao `.gitignore`:
```
# .gitignore
.env
.venv/
__pycache__/
*.pyc
```

### 0.6 — Configuração central (`app/core/config.py`)

```python
# app/core/config.py
from decouple import config

DATABASE_URL: str = config("DATABASE_URL")
SECRET_KEY: str = config("SECRET_KEY")
DEBUG: bool = config("DEBUG", default=False, cast=bool)
JWT_LIFETIME_SECONDS: int = config("JWT_LIFETIME_SECONDS", default=3600, cast=int)
MAX_IMAGE_SIZE_MB: int = config("MAX_IMAGE_SIZE_MB", default=5, cast=int)
```

### 0.7 — Conexão com banco (`app/core/database.py`)

```python
# app/core/database.py
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    """Classe base para todos os modelos SQLAlchemy do projeto."""


async def get_db() -> AsyncSession:
    """Dependency do FastAPI que fornece uma sessão assíncrona por request."""
    async with AsyncSessionLocal() as session:
        yield session
```

> **O que é `yield` aqui?** FastAPI chama `get_db()` antes de cada request, pega o session, e fecha automaticamente depois. É o equivalente ao `with` block — você não precisa fechar na mão.

### 0.8 — `main.py` mínimo

```python
# main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação (startup e shutdown)."""
    # Código aqui roda UMA VEZ quando o servidor sobe
    print("Servidor subindo...")
    yield
    # Código aqui roda quando o servidor desce
    print("Servidor descendo...")


app = FastAPI(title="Insonia v2", lifespan=lifespan)


@app.get("/health")
async def health():
    """Verifica se a API está no ar."""
    return {"status": "ok"}
```

### 0.9 — Verificar que funciona

```bash
$ uv run uvicorn main:app --reload
```

Abra no navegador:
- `http://localhost:8000/health` → `{"status": "ok"}`
- `http://localhost:8000/docs` → Swagger UI (documentação interativa automática)

**Critério de aceitação da Fase 0:** `/docs` abre, `/health` retorna 200. ✓

---

## Fase 1 — Modelos e Migrations

### 1.1 — Configurar Alembic

```bash
$ uv run alembic init migrations
```

Isso cria `migrations/env.py` e `alembic.ini`. Agora edite os dois:

**`alembic.ini`** — encontre a linha `sqlalchemy.url` e deixe em branco (vamos pegar do `.env`):
```ini
sqlalchemy.url =
```

**`migrations/env.py`** — substitua o conteúdo pelas versões async:

```python
# migrations/env.py
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import DATABASE_URL
from app.core.database import Base

# Importar todos os modelos aqui para o Alembic detectá-los
import app.models  # noqa: F401

config = context.config
fileConfig(config.config_file_name)
target_metadata = Base.metadata


def run_migrations_offline():
    """Executa as migrations sem conexão ativa ao banco (modo offline)."""
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online():
    """Executa as migrations com conexão ativa ao banco (modo online, async)."""
    connectable = create_async_engine(DATABASE_URL)
    async with connectable.connect() as connection:
        await connection.run_sync(
            lambda conn: context.configure(
                connection=conn,
                target_metadata=target_metadata,
            )
        )
        async with connection.begin():
            await connection.run_sync(lambda _: context.run_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
```

### 1.2 — Criar os modelos

Crie cada arquivo separado por domínio:

```python
# app/models/categoria.py
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Categoria(Base):
    """Modelo de categoria de produto."""

    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True)
```

```python
# app/models/marca.py
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Marca(Base):
    """Modelo de marca de produto."""

    __tablename__ = "marcas"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True)
```

```python
# app/models/produto.py
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Produto(Base):
    """Modelo de produto com preços, estoque e imagens."""

    __tablename__ = "produtos"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(220), unique=True)
    descricao: Mapped[str | None] = mapped_column(Text)
    estoque: Mapped[int] = mapped_column(default=0)

    # Preços como Numeric — armazena centavos com precisão
    preco_venda: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    preco_custo: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    preco_venda_promocional: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))

    currency: Mapped[str] = mapped_column(String(3), default="BRL")

    categoria_id: Mapped[int | None] = mapped_column(ForeignKey("categorias.id"))
    marca_id: Mapped[int | None] = mapped_column(ForeignKey("marcas.id"))

    imagens: Mapped[list["ProdutoImagem"]] = relationship(back_populates="produto")


class ProdutoImagem(Base):
    """Modelo de imagem associada a um produto."""

    __tablename__ = "produto_imagens"

    id: Mapped[int] = mapped_column(primary_key=True)
    produto_id: Mapped[int] = mapped_column(ForeignKey("produtos.id", ondelete="CASCADE"))
    path: Mapped[str] = mapped_column(String(500))

    produto: Mapped["Produto"] = relationship(back_populates="imagens")
```

```python
# app/models/variacao.py
from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class NomeVariacao(Base):
    """Nome de um atributo de variação (ex: Tamanho, Cor)."""

    __tablename__ = "nome_variacoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)

    valores: Mapped[list["ValorVariacao"]] = relationship(back_populates="nome")


class ValorVariacao(Base):
    """Valor concreto de um atributo de variação (ex: M, Azul)."""

    __tablename__ = "valor_variacoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome_id: Mapped[int] = mapped_column(ForeignKey("nome_variacoes.id"))
    valor: Mapped[str] = mapped_column(String(100))

    nome: Mapped["NomeVariacao"] = relationship(back_populates="valores")

    __table_args__ = (UniqueConstraint("nome_id", "valor"),)


class Variacao(Base):
    """Associação entre produto e um valor de variação específico."""

    __tablename__ = "variacoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    produto_id: Mapped[int] = mapped_column(ForeignKey("produtos.id", ondelete="CASCADE"))
    valor_variacao_id: Mapped[int] = mapped_column(ForeignKey("valor_variacoes.id"))

    __table_args__ = (UniqueConstraint("produto_id", "valor_variacao_id"),)
```

```python
# app/models/venda.py
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Venda(Base):
    """Registro de uma venda com totais calculados."""

    __tablename__ = "vendas"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    data_venda: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    valor_total: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    lucro_total: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)

    itens: Mapped[list["ItemVenda"]] = relationship(back_populates="venda", cascade="all, delete-orphan")


class ItemVenda(Base):
    """Item individual de uma venda, com preço e custo no momento da compra."""

    __tablename__ = "itens_venda"

    id: Mapped[int] = mapped_column(primary_key=True)
    venda_id: Mapped[int] = mapped_column(ForeignKey("vendas.id", ondelete="CASCADE"))
    produto_id: Mapped[int] = mapped_column(ForeignKey("produtos.id", ondelete="RESTRICT"))
    quantidade: Mapped[int]
    preco_venda: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    preco_custo: Mapped[Decimal] = mapped_column(Numeric(14, 2))

    venda: Mapped["Venda"] = relationship(back_populates="itens")
```

**`app/models/__init__.py`** — importe todos para o Alembic detectar:

```python
# app/models/__init__.py
from app.models.categoria import Categoria
from app.models.marca import Marca
from app.models.produto import Produto, ProdutoImagem
from app.models.variacao import NomeVariacao, ValorVariacao, Variacao
from app.models.venda import ItemVenda, Venda

__all__ = [
    "Categoria", "Marca", "Produto", "ProdutoImagem",
    "NomeVariacao", "ValorVariacao", "Variacao",
    "Venda", "ItemVenda",
]
```

### 1.3 — Slug automático

Adicione ao final de `app/models/produto.py` (e repita para `Categoria` e `Marca`):

```python
# Adicionar ao final de app/models/produto.py
from sqlalchemy import event
from slugify import slugify


@event.listens_for(Produto, "before_insert")
@event.listens_for(Produto, "before_update")
def gerar_slug_produto(mapper, connection, target):
    """Gera slug automaticamente a partir do nome antes de inserir ou atualizar."""
    if target.name and not target.slug:
        target.slug = slugify(target.name)
```

### 1.4 — Gerar e aplicar migration

```bash
# Gera o arquivo de migration automaticamente comparando os modelos com o banco
$ uv run alembic revision --autogenerate -m "initial"

# Aplica no banco
$ uv run alembic upgrade head
```

Verifique no banco:
```bash
$ docker compose exec db psql -U insonia -d insonia -c "\dt"
```

**Critério de aceitação da Fase 1:** todas as tabelas aparecem no `\dt`. ✓

---

## Fase 2 — Autenticação (fastapi-users)

> `fastapi-users` é uma biblioteca que gera automaticamente as rotas de auth (register, login, logout, me). Você não escreve essas rotas — só configura.

### 2.1 — Modelo User

```python
# app/models/user.py
from fastapi_users.db import SQLAlchemyBaseUserTable
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(SQLAlchemyBaseUserTable[int], Base):
    """Modelo de usuário com campos extras além do padrão fastapi-users."""

    __tablename__ = "users"

    # SQLAlchemyBaseUserTable já inclui: id, email, hashed_password, is_active, is_superuser, is_verified
    username: Mapped[str] = mapped_column(String(50), unique=True)
```

Adicione `User` ao `app/models/__init__.py`.

### 2.2 — Configurar fastapi-users

```python
# app/core/auth.py
from fastapi_users import FastAPIUsers
from fastapi_users.authentication import AuthenticationBackend, BearerTransport, JWTStrategy
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import JWT_LIFETIME_SECONDS, SECRET_KEY
from app.models.user import User


async def get_user_db(session: AsyncSession):
    """Dependency que fornece o adaptador de banco para fastapi-users."""
    yield SQLAlchemyUserDatabase(session, User)


bearer_transport = BearerTransport(tokenUrl="auth/login")


def get_jwt_strategy() -> JWTStrategy:
    """Retorna a estratégia JWT configurada com chave e tempo de expiração."""
    return JWTStrategy(secret=SECRET_KEY, lifetime_seconds=JWT_LIFETIME_SECONDS)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, int](get_user_db, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)
```

### 2.3 — Schemas de User

```python
# app/schemas/user.py
from fastapi_users import schemas


class UserRead(schemas.BaseUser[int]):
    """Schema de leitura do usuário, exposto nas respostas da API."""

    username: str


class UserCreate(schemas.BaseUserCreate):
    """Schema de criação de usuário no registro."""

    username: str


class UserUpdate(schemas.BaseUserUpdate):
    """Schema de atualização parcial do usuário."""

    username: str | None = None
```

### 2.4 — Registrar rotas no `main.py`

```python
# main.py (versão completa da Fase 2)
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.auth import auth_backend, fastapi_users
from app.schemas.user import UserCreate, UserRead, UserUpdate


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação (startup e shutdown)."""
    yield


app = FastAPI(title="Insonia v2", lifespan=lifespan)


@app.get("/health")
async def health():
    """Verifica se a API está no ar."""
    return {"status": "ok"}


# Rotas geradas automaticamente pelo fastapi-users:
# POST /auth/register
# POST /auth/login  (retorna JWT)
# POST /auth/logout
# GET  /users/me
# PATCH /users/me
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)
```

### 2.5 — Migration para User

```bash
$ uv run alembic revision --autogenerate -m "add users table"
$ uv run alembic upgrade head
```

### 2.6 — Testar via /docs

1. Abra `http://localhost:8000/docs`
2. `POST /auth/register` → crie um usuário
3. `POST /auth/login` → copie o `access_token`
4. Clique em "Authorize" no topo → cole o token
5. `GET /users/me` → deve retornar seus dados

**Critério de aceitação da Fase 2:** fluxo acima funciona. ✓

---

## Fase 3 — Serviços de Negócio

> Serviços são funções Python puras que recebem a sessão do banco e executam a lógica. Nenhuma dependência de GraphQL ou HTTP aqui.

### 3.1 — Serviço de estoque

```python
# app/services/estoque.py
from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.produto import Produto


async def verificar_estoque(db: AsyncSession, produto_id: int, quantidade: int) -> None:
    """Levanta HTTPException se o produto não tiver estoque suficiente."""
    result = await db.execute(select(Produto.estoque).where(Produto.id == produto_id))
    estoque = result.scalar_one_or_none()
    if estoque is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    if estoque < quantidade:
        raise HTTPException(status_code=400, detail=f"Estoque insuficiente: {estoque} disponível")


async def decrementar_estoque(db: AsyncSession, produto_id: int, quantidade: int) -> None:
    """Subtrai a quantidade do estoque do produto (usado ao registrar uma venda)."""
    await db.execute(
        update(Produto)
        .where(Produto.id == produto_id)
        .values(estoque=Produto.estoque - quantidade)
    )


async def incrementar_estoque(db: AsyncSession, produto_id: int, quantidade: int) -> None:
    """Adiciona a quantidade ao estoque do produto (usado ao cancelar uma venda)."""
    await db.execute(
        update(Produto)
        .where(Produto.id == produto_id)
        .values(estoque=Produto.estoque + quantidade)
    )
```

### 3.2 — Serviço de venda

```python
# app/services/venda.py
from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.venda import ItemVenda, Venda
from app.services.estoque import decrementar_estoque, incrementar_estoque, verificar_estoque


@dataclass
class ItemInput:
    """Dados de um item a ser incluído em uma venda."""

    produto_id: int
    quantidade: int
    preco_venda: Decimal
    preco_custo: Decimal


async def criar_venda(db: AsyncSession, usuario_id: int, itens: list[ItemInput]) -> Venda:
    """Cria uma venda atomicamente: verifica estoque, decrementa e persiste os itens."""
    async with db.begin():
        # Verificar estoque de todos antes de qualquer decremento
        for item in itens:
            await verificar_estoque(db, item.produto_id, item.quantidade)

        venda = Venda(usuario_id=usuario_id)
        db.add(venda)
        await db.flush()  # flush para obter venda.id sem commitar

        valor_total = Decimal("0")
        lucro_total = Decimal("0")

        for item in itens:
            iv = ItemVenda(
                venda_id=venda.id,
                produto_id=item.produto_id,
                quantidade=item.quantidade,
                preco_venda=item.preco_venda,
                preco_custo=item.preco_custo,
            )
            db.add(iv)
            await decrementar_estoque(db, item.produto_id, item.quantidade)

            subtotal = item.preco_venda * item.quantidade
            custo_total = item.preco_custo * item.quantidade
            valor_total += subtotal
            lucro_total += subtotal - custo_total

        venda.valor_total = valor_total
        venda.lucro_total = lucro_total

    return venda


async def remover_venda(db: AsyncSession, venda_id: int) -> None:
    """Remove uma venda e restaura o estoque de todos os seus itens."""
    async with db.begin():
        result = await db.execute(
            select(Venda)
            .options(selectinload(Venda.itens))
            .where(Venda.id == venda_id)
        )
        venda = result.scalar_one_or_none()
        if venda is None:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Venda não encontrada")

        for item in venda.itens:
            await incrementar_estoque(db, item.produto_id, item.quantidade)

        await db.delete(venda)
```

> **Nota sobre `async with db.begin()`:** isso garante que ou tudo salva, ou nada salva. Se der erro no meio da criação dos itens, o estoque não é decrementado e a venda não existe. Equivalente ao `@transaction.atomic` do Django.

---

## Fase 4 — GraphQL (Strawberry)

> No Strawberry, você define os tipos usando classes Python com `@strawberry.type`. O schema GraphQL é gerado automaticamente a partir dessas classes.

### 4.1 — Types

```python
# app/graphql/types.py
import strawberry
from decimal import Decimal


@strawberry.type
class MoneyType:
    """Representa um valor monetário com moeda."""

    amount: float
    currency: str


@strawberry.type
class CategoriaType:
    """Tipo GraphQL para categoria de produto."""

    id: int
    name: str
    slug: str


@strawberry.type
class MarcaType:
    """Tipo GraphQL para marca de produto."""

    id: int
    name: str
    slug: str


@strawberry.type
class ProdutoType:
    """Tipo GraphQL para produto com preços e estoque."""

    id: int
    name: str
    slug: str
    descricao: str | None
    estoque: int
    preco_venda: MoneyType
    preco_custo: MoneyType
    preco_venda_promocional: MoneyType | None
```

### 4.2 — Queries

```python
# app/graphql/queries.py
from typing import Optional

import strawberry
from sqlalchemy import select
from strawberry.types import Info

from app.graphql.types import CategoriaType, MarcaType, ProdutoType, MoneyType
from app.models.categoria import Categoria
from app.models.marca import Marca
from app.models.produto import Produto


def produto_model_to_type(p: Produto) -> ProdutoType:
    """Converte um modelo ORM Produto para o tipo GraphQL ProdutoType."""
    return ProdutoType(
        id=p.id,
        name=p.name,
        slug=p.slug,
        descricao=p.descricao,
        estoque=p.estoque,
        preco_venda=MoneyType(amount=float(p.preco_venda), currency=p.currency),
        preco_custo=MoneyType(amount=float(p.preco_custo), currency=p.currency),
        preco_venda_promocional=MoneyType(amount=float(p.preco_venda_promocional), currency=p.currency)
        if p.preco_venda_promocional else None,
    )


@strawberry.type
class Query:
    """Raiz de queries GraphQL do projeto."""

    @strawberry.field
    async def todos_produtos(self, info: Info) -> list[ProdutoType]:
        """Retorna todos os produtos cadastrados."""
        db = info.context["db"]
        result = await db.execute(select(Produto))
        return [produto_model_to_type(p) for p in result.scalars()]

    @strawberry.field
    async def produto(self, info: Info, id: int) -> Optional[ProdutoType]:
        """Retorna um produto pelo ID, ou None se não encontrado."""
        db = info.context["db"]
        result = await db.execute(select(Produto).where(Produto.id == id))
        p = result.scalar_one_or_none()
        return produto_model_to_type(p) if p else None

    @strawberry.field
    async def todas_categorias(self, info: Info) -> list[CategoriaType]:
        """Retorna todas as categorias cadastradas."""
        db = info.context["db"]
        result = await db.execute(select(Categoria))
        rows = result.scalars().all()
        return [CategoriaType(id=r.id, name=r.name, slug=r.slug) for r in rows]
```

### 4.3 — Mutations

```python
# app/graphql/mutations.py
import strawberry
from strawberry.types import Info

from app.graphql.types import ProdutoType
from app.services.venda import ItemInput, criar_venda as svc_criar_venda


@strawberry.input
class ItemVendaInput:
    """Input GraphQL para um item ao criar uma venda."""

    produto_id: int
    quantidade: int


@strawberry.type
class VendaResult:
    """Resultado retornado após criação de uma venda."""

    id: int
    valor_total: float
    lucro_total: float


@strawberry.type
class Mutation:
    """Raiz de mutations GraphQL do projeto."""

    @strawberry.mutation
    async def criar_venda(self, info: Info, itens: list[ItemVendaInput]) -> VendaResult:
        """Cria uma venda para o usuário autenticado com os itens informados."""
        db = info.context["db"]
        user = info.context["user"]  # verificado na Fase 2

        # Buscar preços do banco para não confiar no cliente
        from sqlalchemy import select
        from app.models.produto import Produto

        items_input = []
        for item in itens:
            result = await db.execute(select(Produto).where(Produto.id == item.produto_id))
            produto = result.scalar_one()
            items_input.append(ItemInput(
                produto_id=item.produto_id,
                quantidade=item.quantidade,
                preco_venda=produto.preco_venda,
                preco_custo=produto.preco_custo,
            ))

        venda = await svc_criar_venda(db, user.id, items_input)
        return VendaResult(id=venda.id, valor_total=float(venda.valor_total), lucro_total=float(venda.lucro_total))
```

### 4.4 — Montar o schema e conectar no FastAPI

```python
# app/graphql/schema.py
import strawberry
from strawberry.fastapi import GraphQLRouter
from sqlalchemy.ext.asyncio import AsyncSession

from app.graphql.queries import Query
from app.graphql.mutations import Mutation


async def get_context(db: AsyncSession) -> dict:
    """Monta o contexto injetado em cada resolver GraphQL."""
    return {"db": db}


schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(schema, context_getter=get_context)
```

Adicione ao `main.py`:
```python
from app.graphql.schema import graphql_app
app.include_router(graphql_app, prefix="/graphql")
```

Após subir, acesse `http://localhost:8000/graphql` para o GraphiQL (interface interativa).

**Critério de aceitação da Fase 4:** queries e mutations respondem no `/graphql`. ✓

---

## Fase 5 — Upload de Imagens

### 5.1 — Endpoint de upload

```python
# app/routers/imagens.py
import asyncio
import os
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_active_user
from app.core.config import MAX_IMAGE_SIZE_MB
from app.core.database import get_db
from app.models.produto import ProdutoImagem

router = APIRouter(prefix="/produtos", tags=["imagens"])

UPLOAD_DIR = Path("media/imagens")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def salvar_imagem(file: UploadFile, produto_id: int) -> str:
    """Valida e persiste um arquivo de imagem no disco, retornando o caminho salvo."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo não permitido: {file.content_type}")

    conteudo = await file.read()
    tamanho_mb = len(conteudo) / (1024 * 1024)
    if tamanho_mb > MAX_IMAGE_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"Arquivo muito grande: {tamanho_mb:.1f}MB")

    nome_arquivo = f"{produto_id}_{file.filename}"
    caminho = UPLOAD_DIR / nome_arquivo
    caminho.write_bytes(conteudo)
    return str(caminho)


@router.post("/{produto_id}/imagens")
async def upload_imagens(
    produto_id: int,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    user=Depends(current_active_user),
):
    """Recebe múltiplos arquivos, salva no disco e registra os caminhos no banco."""
    paths = await asyncio.gather(*[salvar_imagem(f, produto_id) for f in files])

    imagens = [ProdutoImagem(produto_id=produto_id, path=p) for p in paths]
    db.add_all(imagens)
    await db.commit()

    return {"urls": [f"/media/{Path(p).name}" for p in paths]}
```

Adicione ao `main.py`:
```python
from fastapi.staticfiles import StaticFiles
from app.routers.imagens import router as imagens_router

app.mount("/media", StaticFiles(directory="media"), name="media")
app.include_router(imagens_router)
```

---

## Fase 6 — Wiring do Frontend

### 6.1 — CORS

Adicione ao `main.py` antes de registrar as rotas:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # ajuste para o domínio do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6.2 — Contrato de API por tela

| Tela | Operação | Endpoint/Query |
|------|----------|----------------|
| Login | Autenticar | `POST /auth/login` |
| Dashboard | Totais | Query `totalVendas` |
| PDV | Listar produtos | Query `todosProdutos` |
| PDV | Criar venda | Mutation `criarVenda` |
| Produtos | Listar | Query `todosProdutos` |
| Histórico | Vendas por período | Query `totalVendas(periodo: ...)` |

### 6.3 — Interceptor de auth no frontend

No `insonia-frontend`, localize onde as chamadas GraphQL são feitas e adicione o header:

```javascript
// Exemplo para fetch puro
const response = await fetch('http://localhost:8000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  },
  body: JSON.stringify({ query: '...' }),
});
```

---

## Fase 8 — Testes

### 8.1 — Configurar pytest

```python
# tests/conftest.py
import asyncio
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from main import app

TEST_DATABASE_URL = "postgresql+asyncpg://insonia:insonia@localhost:5432/insonia_test"

engine_test = create_async_engine(TEST_DATABASE_URL)
TestSessionLocal = async_sessionmaker(engine_test, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    """Cria todas as tabelas antes dos testes e derruba ao final da sessão."""
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db():
    """Fornece uma sessão de banco de dados de teste para cada teste."""
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client(db):
    """Fornece um AsyncClient com a dependência de banco substituída pelo banco de teste."""
    app.dependency_overrides[get_db] = lambda: db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
```

### 8.2 — Exemplo de teste de serviço

```python
# tests/test_estoque.py
import pytest
from fastapi import HTTPException

from app.services.estoque import decrementar_estoque, verificar_estoque


@pytest.mark.asyncio
async def test_estoque_insuficiente(db, produto_fixture):
    """Garante que verificar_estoque levanta 400 quando a quantidade excede o estoque."""
    with pytest.raises(HTTPException) as exc:
        await verificar_estoque(db, produto_fixture.id, quantidade=9999)
    assert exc.value.status_code == 400
```

---

## Fase 9 — Deploy

### 9.1 — Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 9.2 — docker-compose.yml completo

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: insonia
      POSTGRES_USER: insonia
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://insonia:${DB_PASSWORD}@db:5432/insonia
      SECRET_KEY: ${SECRET_KEY}
      DEBUG: "false"
    depends_on:
      - db
    command: >
      sh -c "uv run alembic upgrade head && uv run uvicorn main:app --host 0.0.0.0 --port 8000"

volumes:
  postgres_data:
```

---

## Referência rápida de comandos

| O que fazer | Comando |
|------------|---------|
| Subir banco | `docker compose up -d db` |
| Subir servidor em dev | `uv run uvicorn main:app --reload` |
| Nova migration | `uv run alembic revision --autogenerate -m "descricao"` |
| Aplicar migrations | `uv run alembic upgrade head` |
| Reverter última migration | `uv run alembic downgrade -1` |
| Rodar testes | `uv run pytest` |
| Instalar dependência | `uv add nome-do-pacote` |
| Instalar dep de dev | `uv add --dev nome-do-pacote` |
