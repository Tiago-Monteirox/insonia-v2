import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product


@pytest.mark.asyncio
async def test_fluxo_completo_pdv(auth_client: AsyncClient, db: AsyncSession):
    """
    Caminho crítico do PDV:
    1. Criar categoria e marca
    2. Criar produto com estoque = 5
    3. Criar venda de 3 unidades (estoque cai para 2)
    4. Cancelar venda (estoque volta para 5)
    """
    # 1. Criar categoria
    cat_resp = await auth_client.post(
        "/graphql",
        json={
            "query": 'mutation { createCategory(input: { name: "Camisetas" }) { id name slug } }'
        },
    )
    cat_data = cat_resp.json()
    assert "errors" not in cat_data, cat_data.get("errors")
    cat_id = cat_data["data"]["createCategory"]["id"]
    assert cat_data["data"]["createCategory"]["slug"] == "camisetas"

    # 2. Criar produto com estoque = 5
    prod_resp = await auth_client.post(
        "/graphql",
        json={
            "query": f"""
                mutation {{
                    createProduct(input: {{
                        name: "Camiseta Azul"
                        salePrice: 79.90
                        costPrice: 30.00
                        stock: 5
                        categoryId: {cat_id}
                    }}) {{ id stock }}
                }}
            """
        },
    )
    prod_data = prod_resp.json()
    assert "errors" not in prod_data, prod_data.get("errors")
    prod_id = prod_data["data"]["createProduct"]["id"]
    assert prod_data["data"]["createProduct"]["stock"] == 5

    # 3. Criar venda de 3 unidades
    sale_resp = await auth_client.post(
        "/graphql",
        json={
            "query": f"""
                mutation {{
                    createSale(items: [{{ productId: {prod_id}, quantity: 3 }}]) {{
                        id
                        totalAmount
                    }}
                }}
            """
        },
    )
    sale_data = sale_resp.json()
    assert "errors" not in sale_data, sale_data.get("errors")
    sale_id = sale_data["data"]["createSale"]["id"]
    assert float(sale_data["data"]["createSale"]["totalAmount"]) == pytest.approx(
        239.70, rel=1e-2
    )

    # verificar estoque via GraphQL (produto query)
    stock_resp = await auth_client.post(
        "/graphql",
        json={"query": f"{{ product(id: {prod_id}) {{ stock }} }}"},
    )
    assert stock_resp.json()["data"]["product"]["stock"] == 2

    # verificar estoque via DB direto
    result = await db.execute(select(Product).where(Product.id == prod_id))
    p = result.scalar_one()
    assert p.stock == 2

    # 4. Cancelar venda — estoque deve voltar para 5
    del_resp = await auth_client.post(
        "/graphql",
        json={"query": f"mutation {{ deleteSale(id: {sale_id}) }}"},
    )
    del_data = del_resp.json()
    assert "errors" not in del_data, del_data.get("errors")
    assert del_data["data"]["deleteSale"] is True

    # verificar estoque restaurado via GraphQL
    stock_resp2 = await auth_client.post(
        "/graphql",
        json={"query": f"{{ product(id: {prod_id}) {{ stock }} }}"},
    )
    assert stock_resp2.json()["data"]["product"]["stock"] == 5

    # verificar estoque restaurado via DB
    await db.refresh(p)
    assert p.stock == 5


@pytest.mark.asyncio
async def test_venda_estoque_insuficiente_retorna_erro_graphql(
    auth_client: AsyncClient, product
):
    """createSale com quantidade maior que estoque deve retornar erro GraphQL."""
    resp = await auth_client.post(
        "/graphql",
        json={
            "query": f"""
                mutation {{
                    createSale(items: [{{ productId: {product.id}, quantity: 9999 }}]) {{
                        id
                    }}
                }}
            """
        },
    )
    data = resp.json()
    assert "errors" in data

    # estoque não deve ter mudado
    stock_resp = await auth_client.post(
        "/graphql",
        json={"query": f"{{ product(id: {product.id}) {{ stock }} }}"},
    )
    assert stock_resp.json()["data"]["product"]["stock"] == 10


@pytest.mark.asyncio
async def test_historico_vendas_do_usuario(auth_client: AsyncClient, product):
    """allSales deve retornar apenas as vendas do usuário autenticado."""
    # criar duas vendas
    for _ in range(2):
        await auth_client.post(
            "/graphql",
            json={
                "query": f"""
                    mutation {{
                        createSale(items: [{{ productId: {product.id}, quantity: 1 }}]) {{
                            id
                        }}
                    }}
                """
            },
        )

    sales_resp = await auth_client.post(
        "/graphql",
        json={"query": "{ allSales { id totalAmount } }"},
    )
    sales_data = sales_resp.json()
    assert "errors" not in sales_data, sales_data.get("errors")
    assert len(sales_data["data"]["allSales"]) == 2
