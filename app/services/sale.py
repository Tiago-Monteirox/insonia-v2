from dataclasses import dataclass
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product
from app.models.sale import Sale, SaleItem
from app.services.stock import decrement_stock_atomic, increment_stock


@dataclass
class SaleItemInput:
    """Dados de entrada de um item de venda vindos do resolver."""

    product_id: int
    quantity: int


async def create_sale(
    db: AsyncSession, user_id: int, items: list[SaleItemInput]
) -> Sale:
    """Cria uma venda atomicamente: verifica estoque e cria a venda automaticamente."""
    async with db.begin():
        sale = Sale(user_id=user_id)
        db.add(sale)
        await db.flush()  # flush para obter sale.id sem commitar

        total_amount = Decimal("0")
        total_profit = Decimal("0")

        for item in items:
            result = await db.execute(
                select(Product.sale_price, Product.cost_price).where(
                    Product.id == item.product_id
                )
            )
            row = result.fetchone()
            if row is None:
                raise ValueError(f"Produto {item.product_id} não encontrado")

            await decrement_stock_atomic(db, item.product_id, item.quantity)

            iv = SaleItem(
                sale_id=sale.id,
                product_id=item.product_id,
                quantity=item.quantity,
                sale_price=row.sale_price,
                cost_price=row.cost_price,
            )
            db.add(iv)

            subtotal = row.sale_price * item.quantity
            total_cost = row.cost_price * item.quantity
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
            raise HTTPException(status_code=404, detail="Venda não encontrada")

        for item in sale.items:
            await increment_stock(db, item.product_id, item.quantity)

        await db.delete(sale)
