from typing import Optional

import strawberry
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from strawberry.types import Info

from app.graphql.types import (
    BrandType,
    CategoryType,
    MoneyType,
    ProductType,
    SaleItemType,
    SaleType,
)
from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product
from app.models.sale import Sale


def product_model_to_type(p: Product) -> ProductType:
    """Converte um modelo ORM de produto para o tipo GraphQL correspondente."""
    return ProductType(
        id=p.id,
        name=p.name,
        slug=p.slug,
        description=p.description,
        stock=p.stock,
        sale_price=MoneyType(amount=float(p.sale_price), currency=p.currency),
        cost_price=MoneyType(amount=float(p.cost_price), currency=p.currency),
        promotional_price=(
            MoneyType(amount=float(p.promotional_price), currency=p.currency)
            if p.promotional_price
            else None
        ),
    )


def sale_model_to_type(s: Sale) -> SaleType:
    """Converte um modelo ORM de venda para o tipo GraphQL correspondente."""
    return SaleType(
        id=s.id,
        user_id=s.user_id,
        sale_date=s.sale_date,
        total_amount=float(s.total_amount),
        total_profit=float(s.total_profit),
        items=[
            SaleItemType(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                sale_price=MoneyType(amount=float(item.sale_price), currency="BRL"),
                cost_price=MoneyType(amount=float(item.cost_price), currency="BRL"),
            )
            for item in s.items
        ],
    )


@strawberry.type
class Query:
    """Raiz de queries GraphQL do projeto."""

    @strawberry.field
    async def all_products(
        self, info: Info, limit: int = 100, offset: int = 0
    ) -> list[ProductType]:
        """Retorna produtos com paginação. Padrão: primeiros 100."""
        db = info.context["db"]
        result = await db.execute(select(Product).limit(limit).offset(offset))
        return [product_model_to_type(p) for p in result.scalars()]

    @strawberry.field
    async def product(self, info: Info, id: int) -> Optional[ProductType]:
        """Consulta um produto por ID ou None se não encontrado."""
        db = info.context["db"]
        result = await db.execute(select(Product).where(Product.id == id))
        p = result.scalar_one_or_none()
        return product_model_to_type(p) if p else None

    @strawberry.field
    async def all_categories(
        self, info: Info, limit: int = 20, offset: int = 0
    ) -> list[CategoryType]:
        """Retorna todas as categorias cadastradas com paginação."""
        db = info.context["db"]
        result = await db.execute(select(Category).limit(limit).offset(offset))
        rows = result.scalars().all()
        return [CategoryType(id=c.id, name=c.name, slug=c.slug) for c in rows]

    @strawberry.field
    async def all_brands(
        self, info: Info, limit: int = 20, offset: int = 0
    ) -> list[BrandType]:
        """Retorna todas as marcas cadastradas com paginação."""
        db = info.context["db"]
        result = await db.execute(select(Brand).limit(limit).offset(offset))
        rows = result.scalars().all()
        return [BrandType(id=r.id, name=r.name, slug=r.slug) for r in rows]

    @strawberry.field
    async def brand(self, info: Info, id: int) -> BrandType | None:
        """Consulta uma marca por ID ou None se não encontrada."""
        db = info.context["db"]
        result = await db.execute(select(Brand).where(Brand.id == id))
        r = result.scalar_one_or_none()
        return BrandType(id=r.id, name=r.name, slug=r.slug) if r else None

    @strawberry.field
    async def all_sales(
        self, info: Info, limit: int = 50, offset: int = 0
    ) -> list[SaleType]:
        """Retorna todas as vendas do usuário autenticado com paginação."""
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

    @strawberry.field
    async def sale(self, info: Info, id: int) -> SaleType | None:
        """Consulta uma venda por ID ou None se não encontrada."""
        db = info.context["db"]
        result = await db.execute(
            select(Sale).options(selectinload(Sale.items)).where(Sale.id == id)
        )
        s = result.scalar_one_or_none()
        return sale_model_to_type(s) if s else None
