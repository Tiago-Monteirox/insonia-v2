from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product


async def check_stock(db: AsyncSession, product_id: int, quantity: int) -> None:
    """Levanta HTTPException se o produto não tiver estoque suficiente."""
    result = await db.execute(select(Product.stock).where(Product.id == product_id))
    stock = result.scalar_one_or_none()
    if stock is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if stock < quantity:
        raise HTTPException(
            status_code=400, detail=f"Insufficient stock: {stock} available"
        )


async def decrement_stock(db: AsyncSession, product_id: int, quantity: int) -> None:
    """Subtrai a quantidade do estoque do produto (usado ao registrar uma venda)."""
    await db.execute(
        update(Product)
        .where(Product.id == product_id)
        .values(stock=Product.stock - quantity)
    )


async def increment_stock(db: AsyncSession, product_id: int, quantity: int) -> None:
    """Adiciona a quantidade ao estoque do produto (usado ao cancelar uma venda)."""
    await db.execute(
        update(Product)
        .where(Product.id == product_id)
        .values(stock=Product.stock + quantity)
    )
