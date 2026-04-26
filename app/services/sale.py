from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.sale import SaleItem, Sale
from app.services.stock import decrement_stock, increment_stock, check_stock


@dataclass
class ItemInput:
    product_id: int
    quantity: int
    sale_price: Decimal
    cost_price: Decimal


async def create_sale(db: AsyncSession, user_id: int, items: list[ItemInput]) -> Sale:
    """Cria uma venda atomicamente: verifica estoque, decrementa e persiste os itens."""
    async with db.begin():
        # Verificar estoque de todos antes de qualquer decremento
        for item in items:
            await check_stock(db, item.product_id, item.quantity)

        sale = Sale(user_id=user_id)
        db.add(sale)
        await db.flush()  # flush para obter sale.id sem commitar

        total_amount = Decimal("0")
        total_profit = Decimal("0")

        for item in items:
            iv = SaleItem(
                sale_id=sale.id,
                product_id=item.product_id,
                quantity=item.quantity,
                sale_price=item.sale_price,
                cost_price=item.cost_price,
            )
            db.add(iv)
            await decrement_stock(db, item.product_id, item.quantity)

            subtotal = item.sale_price * item.quantity
            total_cost = item.cost_price * item.quantity
            total_amount += subtotal
            total_profit += subtotal - total_cost

        sale.total_amount = total_amount
        sale.total_profit = total_profit

    return sale


async def remove_sale(db: AsyncSession, sale_id: int) -> None:
    """Remove uma venda e restaura o estoque de todos os seus itens."""
    async with db.begin():
        result = await db.execute(
            select(Sale).options(selectinload(Sale.items)).where(Sale.id == sale_id)
        )
        sale = result.scalar_one_or_none()
        if sale is None:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail="Venda não encontrada")

        for item in sale.items:
            await increment_stock(db, item.product_id, item.quantity)

        await db.delete(sale)
