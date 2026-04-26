import strawberry
from decimal import Decimal


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