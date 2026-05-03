from datetime import datetime
from decimal import Decimal

import strawberry


@strawberry.type
class VariationValueType:
    """Tipo GraphQL para valor concreto de uma variação (ex: M, Azul)."""

    id: int
    value: str


@strawberry.type
class VariationNameType:
    """Tipo GraphQL para nome de variação com seus valores (ex: Tamanho → [P, M, G])."""

    id: int
    name: str
    values: list[VariationValueType]


@strawberry.type
class MoneyType:
    """Representa valor monetário como moeda."""

    amount: Decimal
    currency: str


@strawberry.type
class CategoryType:
    """Tipo GraphQL para categoria de produto."""

    id: int
    name: str
    slug: str


@strawberry.type
class BrandType:
    """Tipo GraphQL para marca de produto."""

    id: int
    name: str
    slug: str


@strawberry.type
class ProductType:
    """Tipo GraphQL para produto com preços e estoque."""

    id: int
    name: str
    slug: str
    description: str | None
    stock: int
    sale_price: MoneyType
    cost_price: MoneyType
    promotional_price: MoneyType | None
    category_id: int | None
    brand_id: int | None


@strawberry.type
class SaleItemType:
    """Tipo GraphQL para item de venda."""

    id: int
    product_id: int
    quantity: int
    sale_price: MoneyType
    cost_price: MoneyType


@strawberry.type
class SaleType:
    """Tipo GraphQL para uma venda com seus itens."""

    id: int
    user_id: int
    sale_date: datetime
    total_amount: float
    total_profit: float
    items: list[SaleItemType]


@strawberry.type
class DailyRevenuePoint:
    """Ponto do gráfico de faturamento diário."""

    date: str
    total: float


@strawberry.type
class TopProductItem:
    """Produto no ranking de mais vendidos."""

    product_id: int
    name: str
    units_sold: int
    revenue: float


@strawberry.type
class SalesSummary:
    """Totais agregados para um período."""

    total_revenue: float
    total_profit: float
    sale_count: int
    avg_ticket: float
