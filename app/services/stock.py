from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product


async def check_stock_atomic(db: AsyncSession, product_id: int, quantity: int) -> None:
    """Decrementa estoque atomicamente. Levanta ValueError se insuficiente."""
    result = await db.execute(select(Product.stock).where(Product.id == product_id))
    stock = result.scalar_one_or_none()
    if stock is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if stock < quantity:
        raise HTTPException(
            status_code=400, detail=f"Insufficient stock: {stock} available"
        )


async def decrement_stock_atomic(
    db: AsyncSession, product_id: int, quantity: int
) -> None:
    """Decrementa estoque atomicamente. Levanta ValueError se insuficiente."""
    result = await db.execute(
        update(Product)
        .where(Product.id == product_id, Product.stock >= quantity)
        .values(stock=Product.stock - quantity)
        .returning(Product.stock)
    )
    row = result.first()
    if row is None:
        # Produto não existe ou estoque insuficiente — verifica qual
        check = await db.execute(
            select(Product.stock, Product.id).where(Product.id == product_id)
        )
        rec = check.first()
        if rec is None:
            raise ValueError(f"Produto {product_id} não encontrado")
        raise ValueError(
            f"Estoque insuficiente para produto"
            f" {product_id}: {rec.stock} disponível, {quantity} solicitado"
        )


async def increment_stock(db: AsyncSession, product_id: int, quantity: int) -> None:
    """Adiciona a quantidade ao estoque do produto (usado ao cancelar uma venda)."""
    await db.execute(
        update(Product)
        .where(Product.id == product_id)
        .values(stock=Product.stock + quantity)
    )
