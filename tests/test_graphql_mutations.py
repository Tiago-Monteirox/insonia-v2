import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_product(auth_client: AsyncClient):
    """createProduct deve criar o produto e retornar id, name, slug e stock."""
    response = await auth_client.post(
        "/graphql",
        json={
            "query": """
                mutation {
                    createProduct(input: {
                        name: "Camiseta Preta"
                        salePrice: 89.90
                        costPrice: 35.00
                        stock: 20
                    }) {
                        id
                        name
                        slug
                        stock
                    }
                }
            """
        },
    )
    data = response.json()
    assert "errors" not in data, data.get("errors")
    product = data["data"]["createProduct"]
    assert product["name"] == "Camiseta Preta"
    assert product["slug"] == "camiseta-preta"
    assert product["stock"] == 20
    assert product["id"] is not None


@pytest.mark.asyncio
async def test_delete_product_inexistente_retorna_erro_graphql(
    auth_client: AsyncClient,
):
    """deleteProduct com ID inexistente deve retornar erro GraphQL, não 500."""
    response = await auth_client.post(
        "/graphql",
        json={"query": "mutation { deleteProduct(id: 999999) }"},
    )
    data = response.json()
    assert response.status_code == 200
    assert "errors" in data


@pytest.mark.asyncio
async def test_create_sale_e_sale_query(auth_client: AsyncClient, product):
    """Criar venda e depois buscar pelo ID — testa selectinload em sale query."""
    create_resp = await auth_client.post(
        "/graphql",
        json={
            "query": f"""
                mutation {{
                    createSale(items: [{{ productId: {product.id}, quantity: 1 }}]) {{
                        id
                        totalAmount
                    }}
                }}
            """
        },
    )
    sale_data = create_resp.json()
    assert "errors" not in sale_data, sale_data.get("errors")
    sale_id = sale_data["data"]["createSale"]["id"]
    assert float(sale_data["data"]["createSale"]["totalAmount"]) == pytest.approx(50.0)

    get_resp = await auth_client.post(
        "/graphql",
        json={
            "query": f"""
                query {{
                    sale(id: {sale_id}) {{
                        id
                        totalAmount
                        items {{ productId quantity }}
                    }}
                }}
            """
        },
    )
    get_data = get_resp.json()
    assert "errors" not in get_data, get_data.get("errors")
    assert get_data["data"]["sale"]["id"] == sale_id
    assert get_data["data"]["sale"]["items"][0]["quantity"] == 1


@pytest.mark.asyncio
async def test_create_category_e_update_category(auth_client: AsyncClient):
    """Criar e renomear categoria — slug deve ser atualizado."""
    create_resp = await auth_client.post(
        "/graphql",
        json={
            "query": """
                mutation {
                    createCategory(input: { name: "Calças" }) {
                        id
                        slug
                    }
                }
            """
        },
    )
    cat = create_resp.json()["data"]["createCategory"]
    assert cat["slug"] == "calcas"

    update_resp = await auth_client.post(
        "/graphql",
        json={
            "query": f"""
                mutation {{
                    updateCategory(id: {cat["id"]}, input: {{ name: "Bermudas" }}) {{
                        id
                        name
                        slug
                    }}
                }}
            """
        },
    )
    updated = update_resp.json()
    assert "errors" not in updated, updated.get("errors")
    assert updated["data"]["updateCategory"]["name"] == "Bermudas"
    assert updated["data"]["updateCategory"]["slug"] == "bermudas"


@pytest.mark.asyncio
async def test_create_brand_e_update_brand(auth_client: AsyncClient):
    """Criar e renomear marca — slug deve ser atualizado."""
    create_resp = await auth_client.post(
        "/graphql",
        json={
            "query": """
                mutation {
                    createBrand(input: { name: "Nike" }) {
                        id
                        slug
                    }
                }
            """
        },
    )
    brand = create_resp.json()["data"]["createBrand"]
    assert brand["slug"] == "nike"

    update_resp = await auth_client.post(
        "/graphql",
        json={
            "query": f"""
                mutation {{
                    updateBrand(id: {brand["id"]}, input: {{ name: "Adidas" }}) {{
                        id
                        name
                        slug
                    }}
                }}
            """
        },
    )
    updated = update_resp.json()
    assert "errors" not in updated, updated.get("errors")
    assert updated["data"]["updateBrand"]["slug"] == "adidas"


@pytest.mark.asyncio
async def test_delete_sale_restaura_estoque(auth_client: AsyncClient, product):
    """deleteSale deve restaurar estoque e retornar True."""
    create_resp = await auth_client.post(
        "/graphql",
        json={
            "query": f"""
                mutation {{
                    createSale(items: [{{ productId: {product.id}, quantity: 4 }}]) {{
                        id
                    }}
                }}
            """
        },
    )
    sale_id = create_resp.json()["data"]["createSale"]["id"]

    del_resp = await auth_client.post(
        "/graphql",
        json={"query": f"mutation {{ deleteSale(id: {sale_id}) }}"},
    )
    del_data = del_resp.json()
    assert "errors" not in del_data, del_data.get("errors")
    assert del_data["data"]["deleteSale"] is True

    # estoque deve ter voltado para 10
    stock_resp = await auth_client.post(
        "/graphql",
        json={"query": f"{{ product(id: {product.id}) {{ stock }} }}"},
    )
    assert stock_resp.json()["data"]["product"]["stock"] == 10


@pytest.mark.asyncio
async def test_update_product(auth_client: AsyncClient, product):
    """updateProduct deve alterar nome e slug do produto."""
    resp = await auth_client.post(
        "/graphql",
        json={
            "query": f"""
                mutation {{
                    updateProduct(id: {product.id}, input: {{
                        name: "Produto Atualizado"
                        salePrice: 60.00
                        costPrice: 25.00
                        stock: 8
                    }}) {{
                        id
                        name
                        slug
                        stock
                    }}
                }}
            """
        },
    )
    data = resp.json()
    assert "errors" not in data, data.get("errors")
    updated = data["data"]["updateProduct"]
    assert updated["name"] == "Produto Atualizado"
    assert updated["slug"] == "produto-atualizado"
    assert updated["stock"] == 8
