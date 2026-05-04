from datetime import date, datetime, timedelta, timezone
from typing import Optional

import strawberry
from sqlalchemy import Date, cast, func, select
from sqlalchemy.orm import selectinload
from strawberry.types import Info

from app.graphql.types import (
    BrandType,
    CategoryType,
    DailyRevenuePoint,
    MoneyType,
    ProductType,
    SaleItemType,
    SalesSummary,
    SaleType,
    TopProductItem,
    VariationNameType,
    VariationValueType,
)
from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product
from app.models.sale import Sale, SaleItem
from app.models.variation import VariationName


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
        category_id=p.category_id,
        brand_id=p.brand_id,
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
    async def all_variation_names(self, info: Info) -> list[VariationNameType]:
        """Retorna todas as dimensões de variação com seus valores."""
        db = info.context["db"]
        result = await db.execute(
            select(VariationName).options(selectinload(VariationName.values))
        )
        return [
            VariationNameType(
                id=vn.id,
                name=vn.name,
                values=[VariationValueType(id=v.id, value=v.value) for v in vn.values],
            )
            for vn in result.scalars().all()
        ]

    @strawberry.field
    async def all_sales(
        self,
        info: Info,
        limit: int = 50,
        offset: int = 0,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> list[SaleType]:
        """Vendas do usuário com paginação e filtro opcional de período (YYYY-MM-DD)."""
        db = info.context["db"]
        user = info.context["user"]

        stmt = (
            select(Sale)
            .options(selectinload(Sale.items))
            .where(Sale.user_id == user.id)
            .order_by(Sale.sale_date.desc())
        )
        if date_from:
            stmt = stmt.where(
                cast(Sale.sale_date, Date) >= date.fromisoformat(date_from)
            )
        if date_to:
            stmt = stmt.where(cast(Sale.sale_date, Date) <= date.fromisoformat(date_to))

        result = await db.execute(stmt.limit(limit).offset(offset))
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

    @strawberry.field
    async def sales_summary(
        self,
        info: Info,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> SalesSummary:
        """Agrega faturamento, lucro e contagem de vendas no período.
        Datas no formato YYYY-MM-DD. Padrão: últimos 30 dias."""
        db = info.context["db"]
        user = info.context["user"]

        d_from = (
            date.fromisoformat(date_from)
            if date_from
            else datetime.now(timezone.utc).date() - timedelta(days=30)
        )
        d_to = (
            date.fromisoformat(date_to)
            if date_to
            else datetime.now(timezone.utc).date()
        )

        result = await db.execute(
            select(
                func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
                func.coalesce(func.sum(Sale.total_profit), 0).label("profit"),
                func.count(Sale.id).label("count"),
            )
            .where(Sale.user_id == user.id)
            .where(cast(Sale.sale_date, Date) >= d_from)
            .where(cast(Sale.sale_date, Date) <= d_to)
        )
        row = result.one()
        revenue = float(row.revenue)
        count = row.count
        return SalesSummary(
            total_revenue=revenue,
            total_profit=float(row.profit),
            sale_count=count,
            avg_ticket=revenue / count if count else 0.0,
        )

    @strawberry.field
    async def daily_revenue(
        self,
        info: Info,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> list[DailyRevenuePoint]:
        """Faturamento agrupado por dia para o gráfico do Dashboard."""
        db = info.context["db"]
        user = info.context["user"]

        d_from = (
            date.fromisoformat(date_from)
            if date_from
            else datetime.now(timezone.utc).date() - timedelta(days=30)
        )
        d_to = (
            date.fromisoformat(date_to)
            if date_to
            else datetime.now(timezone.utc).date()
        )

        result = await db.execute(
            select(
                cast(Sale.sale_date, Date).label("day"),
                func.sum(Sale.total_amount).label("total"),
            )
            .where(Sale.user_id == user.id)
            .where(cast(Sale.sale_date, Date) >= d_from)
            .where(cast(Sale.sale_date, Date) <= d_to)
            .group_by("day")
            .order_by("day")
        )
        return [
            DailyRevenuePoint(
                date=row.day.strftime("%d/%m"),
                total=float(row.total),
            )
            for row in result.all()
        ]

    @strawberry.field
    async def top_products(self, info: Info, limit: int = 5) -> list[TopProductItem]:
        """Produtos com maior volume de vendas (por quantidade de unidades)."""
        db = info.context["db"]
        user = info.context["user"]

        result = await db.execute(
            select(
                SaleItem.product_id,
                Product.name,
                func.sum(SaleItem.quantity).label("units"),
                func.sum(SaleItem.sale_price * SaleItem.quantity).label("revenue"),
            )
            .join(Product, SaleItem.product_id == Product.id)
            .join(Sale, SaleItem.sale_id == Sale.id)
            .where(Sale.user_id == user.id)
            .group_by(SaleItem.product_id, Product.name)
            .order_by(func.sum(SaleItem.quantity).desc())
            .limit(limit)
        )
        return [
            TopProductItem(
                product_id=row.product_id,
                name=row.name,
                units_sold=int(row.units),
                revenue=float(row.revenue),
            )
            for row in result.all()
        ]
