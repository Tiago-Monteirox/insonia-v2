import strawberry
from strawberry.types import Info

from app.graphql.types import ProductType
from app.services.sale import ItemInput, create_sale as svc_create_sale


@strawberry.input
class SaleItemInput:
    """Input GraphQL para um item ao criar uma venda."""

    product_id: int
    quantity: int


@strawberry.type
class SaleResult:
    """Resultado retornado após criação de uma venda."""

    id: int
    total_amount: float
    total_profit: float


@strawberry.type
class Mutation:
    """Raiz de mutations GraphQL do projeto."""

    @strawberry.mutation
    async def create_sale(self, info: Info, items: list[SaleItemInput]) -> SaleResult:
        """Cria uma venda para o usuário autenticado com os itens informados."""
        db = info.context["db"]
        user = info.context["user"]

        # Buscar preços do banco para não confiar no cliente
        from sqlalchemy import select
        from app.models.product import Product

        items_input = []
        for item in items:
            result = await db.execute(select(Product).where(Product.id == item.product_id))
            product = result.scalar_one()
            items_input.append(ItemInput(
                product_id=item.product_id,
                quantity=item.quantity,
                sale_price=product.sale_price,
                cost_price=product.cost_price
            ))

        sale = await svc_create_sale(db, user.id, items_input)
        return SaleResult(id=sale.id, total_amount=float(sale.total_amount), total_profit=float(sale.total_profit))