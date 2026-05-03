import strawberry


@strawberry.input
class ProductInput:
    """Input para criação ou atualização de produto."""

    name: str
    sale_price: float
    cost_price: float
    stock: int = 0
    description: str | None = None
    promotional_price: float | None = None
    currency: str = "BRL"
    category_id: int | None = None
    brand_id: int | None = None


@strawberry.input
class CategoryInput:
    """Input para criação ou atualização de categoria."""

    name: str


@strawberry.input
class BrandInput:
    """Input para criação ou atualização de marca."""

    name: str


@strawberry.input
class VariationNameInput:
    """Input para criar ou renomear uma dimensão de variação."""

    name: str


@strawberry.input
class VariationValueInput:
    """Input para adicionar um valor a uma dimensão existente."""

    name_id: int
    value: str
