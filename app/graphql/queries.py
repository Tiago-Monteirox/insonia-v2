from typing import Optional
from unittest import result

import strawberry
from sqlalchemy import select
from strawberry.types import Info

from app.graphql.types import CategoryType, BrandType, ProductType, MoneyType
from app.models.category import Category
from app.models.brand import Brand
from app.models.product import Product


def product_model_to_type(p: Product) -> ProductType:
    """Converte um modelo ORM de produto para o tipo GraphQL correspondente."""
    return ProductType(
        id=p.id,
        name=p.name,
        slug=p.slug,
        description=p.description,
        sale_price=MoneyType(amount=float(p.sale_price), currency=p.currency),
        cost_price=MoneyType(amount=float(p.cost_price), currency=p.currency),
        promotional_price=MoneyType(amount=float(p.promotional_price), currency=p.currency)
        if p.promotional_price else None
    )


@strawberry.type
class Query:
    """Raiz de queries GraphQL do projeto."""
    
    @strawberry.field
    async def all_products(self, info: Info) -> list[ProductType]:
        """Retorna todos os produtos cadastrados."""
        db = info.context["db"]
        result = await db.execute(select(Product))
        return [product_model_to_type(p) for p in result.scalars()]

    @strawberry.field
    async def product(self, info: Info, id: int) -> Optional[ProductType]:
        """Consulta um produto por ID ou None se não encontrado."""
        db = info.context["db"]
        result = await db.execute(select(Product).where(Product.id == id))
        p = result.scalar_one_or_none()
        return product_model_to_type(p) if p else None

    @strawberry.field
    async def all_categories(self, info: Info) -> list[CategoryType]:
        """Retorna todas as categorias cadastradas."""
        db = info.context["db"]
        result = await db.execute(select(Category))
        rows = result.scalars().all()
        return [CategoryType(id=c.id, name=c.name, slug=c.slug) for c in rows]

