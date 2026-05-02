import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.sale import SaleItemInput, create_sale, remove_sale


@pytest.mark.asyncio
async def test_create_sale_decrementa_estoque(db: AsyncSession, product, user: User):
    """create_sale deve decrementar o estoque dos itens vendidos."""
    items = [SaleItemInput(product_id=product.id, quantity=2)]

    sale = await create_sale(db, user_id=user.id, items=items)

    await db.refresh(product)
    assert product.stock == 8
    assert sale.id is not None
    assert float(sale.total_amount) == 100.00
    assert float(sale.total_profit) == 60.00


@pytest.mark.asyncio
async def test_create_sale_estoque_insuficiente_faz_rollback(
    db: AsyncSession, product, user: User
):
    """create_sale deve fazer rollback completo se qualquer item tiver estoque insuficiente."""
    items = [SaleItemInput(product_id=product.id, quantity=9999)]

    with pytest.raises(ValueError):
        await create_sale(db, user_id=user.id, items=items)

    await db.refresh(product)
    assert product.stock == 10


@pytest.mark.asyncio
async def test_remove_sale_restaura_estoque(db: AsyncSession, product, user: User):
    """remove_sale deve devolver o estoque de todos os itens da venda."""
    items = [SaleItemInput(product_id=product.id, quantity=3)]

    sale = await create_sale(db, user_id=user.id, items=items)
    await db.refresh(product)
    assert product.stock == 7

    # commit limpa a transação implícita do refresh antes de remove_sale
    # chamar db.begin(), evitando "transaction already begun"
    await db.commit()

    await remove_sale(db, sale.id)
    await db.refresh(product)
    assert product.stock == 10


@pytest.mark.asyncio
async def test_remove_sale_inexistente_levanta_erro(db: AsyncSession):
    """remove_sale deve levantar ValueError para ID de venda que não existe."""
    with pytest.raises(ValueError):
        await remove_sale(db, sale_id=99999)
