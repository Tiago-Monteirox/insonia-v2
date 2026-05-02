from datetime import datetime
from decimal import Decimal

import strawberry


@strawberry.type
class VaritionNameType:
    """Tipo GraphQL para nome de variação de produto."""

    id: int
    name: str


@strawberry.type
class VariationValueType:
    """Tipo GraphQL para valor concreto de um atributo de variação."""

    id: int
    value: str
    variation_name: VaritionNameType


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
    sale_price: MoneyType
    cost_price: MoneyType
    promotional_price: MoneyType | None


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
    sale_date: datetime
    total_amount: float
    total_profit: float
    items: list[SaleItemType]
