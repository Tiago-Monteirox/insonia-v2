import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_sales_summary_sem_vendas(auth_client: AsyncClient):
    """salesSummary sem vendas deve retornar zeros."""
    resp = await auth_client.post(
        "/graphql",
        json={
            "query": """
                {
                    salesSummary {
                        totalRevenue totalProfit saleCount avgTicket
                    }
                }
            """
        },
    )
    data = resp.json()
    assert "errors" not in data, data.get("errors")
    s = data["data"]["salesSummary"]
    assert s["totalRevenue"] == 0.0
    assert s["totalProfit"] == 0.0
    assert s["saleCount"] == 0
    assert s["avgTicket"] == 0.0


@pytest.mark.asyncio
async def test_sales_summary_com_vendas(auth_client: AsyncClient, product):
    """salesSummary deve agregar corretamente após criação de venda."""
    await auth_client.post(
        "/graphql",
        json={
            "query": f"""
                mutation {{
                    createSale(items: [{{ productId: {product.id}, quantity: 2 }}]) {{
                        id totalAmount
                    }}
                }}
            """
        },
    )

    resp = await auth_client.post(
        "/graphql",
        json={
            "query": """
                {
                    salesSummary {
                        totalRevenue totalProfit saleCount avgTicket
                    }
                }
            """
        },
    )
    data = resp.json()
    assert "errors" not in data, data.get("errors")
    s = data["data"]["salesSummary"]
    assert s["saleCount"] == 1
    assert s["totalRevenue"] == pytest.approx(100.0)
    assert s["avgTicket"] == pytest.approx(100.0)


@pytest.mark.asyncio
async def test_daily_revenue(auth_client: AsyncClient, product):
    """dailyRevenue deve retornar pontos de faturamento diário."""
    await auth_client.post(
        "/graphql",
        json={
            "query": f"""
                mutation {{
                    createSale(items: [{{ productId: {product.id}, quantity: 1 }}]) {{ id }}
                }}
            """
        },
    )

    resp = await auth_client.post(
        "/graphql",
        json={"query": "{ dailyRevenue { date total } }"},
    )
    data = resp.json()
    assert "errors" not in data, data.get("errors")
    points = data["data"]["dailyRevenue"]
    assert len(points) >= 1
    assert all("date" in p and "total" in p for p in points)


@pytest.mark.asyncio
async def test_top_products(auth_client: AsyncClient, product):
    """topProducts deve retornar produtos mais vendidos."""
    await auth_client.post(
        "/graphql",
        json={
            "query": f"""
                mutation {{
                    createSale(items: [{{ productId: {product.id}, quantity: 3 }}]) {{ id }}
                }}
            """
        },
    )

    resp = await auth_client.post(
        "/graphql",
        json={
            "query": "{ topProducts(limit: 5) { productId name unitsSold revenue } }"
        },
    )
    data = resp.json()
    assert "errors" not in data, data.get("errors")
    prods = data["data"]["topProducts"]
    assert len(prods) >= 1
    assert prods[0]["productId"] == product.id
    assert prods[0]["unitsSold"] == 3


@pytest.mark.asyncio
async def test_all_sales_filtro_data(auth_client: AsyncClient, product):
    """allSales com dateFrom/dateTo deve filtrar por data."""
    await auth_client.post(
        "/graphql",
        json={
            "query": f"""
                mutation {{
                    createSale(items: [{{ productId: {product.id}, quantity: 1 }}]) {{ id }}
                }}
            """
        },
    )

    resp = await auth_client.post(
        "/graphql",
        json={
            "query": """
                {
                    allSales(dateFrom: "2000-01-01", dateTo: "2099-12-31") {
                        id totalAmount
                    }
                }
            """
        },
    )
    data = resp.json()
    assert "errors" not in data, data.get("errors")
    assert len(data["data"]["allSales"]) >= 1

    resp_vazio = await auth_client.post(
        "/graphql",
        json={
            "query": """
                {
                    allSales(dateFrom: "1990-01-01", dateTo: "1990-01-02") {
                        id
                    }
                }
            """
        },
    )
    data_vazio = resp_vazio.json()
    assert "errors" not in data_vazio, data_vazio.get("errors")
    assert data_vazio["data"]["allSales"] == []
