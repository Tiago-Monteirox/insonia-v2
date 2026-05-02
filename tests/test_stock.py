import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.stock import (
    check_stock_atomic,
    decrement_stock_atomic,
    increment_stock,
)


@pytest.mark.asyncio
async def test_check_stock_suficiente(db: AsyncSession, product):
    """check_stock não levanta nada quando há estoque suficiente."""
    await check_stock_atomic(db, product.id, quantity=5)  # não deve levantar


@pytest.mark.asyncio
async def test_check_stock_insuficiente(db: AsyncSession, product):
    """check_stock levanta HTTPException 400 quando a quantidade excede o estoque."""
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        await check_stock_atomic(db, product.id, quantity=100)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_check_stock_produto_inexistente(db: AsyncSession):
    """check_stock levanta HTTPException 404 para produto que não existe."""
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        await check_stock_atomic(db, product_id=99999, quantity=1)
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_decrement_stock(db: AsyncSession, product):
    """decrement_stock subtrai a quantidade correta do estoque."""
    await decrement_stock_atomic(db, product.id, quantity=3)
    await db.refresh(product)
    assert product.stock == 7


@pytest.mark.asyncio
async def test_increment_stock(db: AsyncSession, product):
    """increment_stock restaura a quantidade ao estoque."""
    await decrement_stock_atomic(db, product.id, quantity=5)
    await increment_stock(db, product.id, quantity=5)
    await db.refresh(product)
    assert product.stock == 10
