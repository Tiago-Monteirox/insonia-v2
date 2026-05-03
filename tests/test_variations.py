import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_variation_name(auth_client: AsyncClient):
    """createVariationName deve criar dimensão e retornar id e name."""
    resp = await auth_client.post(
        "/graphql",
        json={
            "query": """
                mutation {
                    createVariationName(input: { name: "Tamanho" }) {
                        id name values { id value }
                    }
                }
            """
        },
    )
    data = resp.json()
    assert "errors" not in data, data.get("errors")
    vn = data["data"]["createVariationName"]
    assert vn["name"] == "Tamanho"
    assert vn["values"] == []
    assert vn["id"] is not None


@pytest.mark.asyncio
async def test_add_variation_value(auth_client: AsyncClient):
    """addVariationValue deve adicionar valor à dimensão e retornar dimensão atualizada."""
    create_resp = await auth_client.post(
        "/graphql",
        json={
            "query": """
                mutation {
                    createVariationName(input: { name: "Cor" }) { id }
                }
            """
        },
    )
    name_id = create_resp.json()["data"]["createVariationName"]["id"]

    add_resp = await auth_client.post(
        "/graphql",
        json={
            "query": f"""
                mutation {{
                    addVariationValue(input: {{ nameId: {name_id}, value: "Azul" }}) {{
                        id name values {{ id value }}
                    }}
                }}
            """
        },
    )
    data = add_resp.json()
    assert "errors" not in data, data.get("errors")
    vn = data["data"]["addVariationValue"]
    assert vn["name"] == "Cor"
    assert any(v["value"] == "Azul" for v in vn["values"])


@pytest.mark.asyncio
async def test_all_variation_names_com_valores(auth_client: AsyncClient):
    """allVariationNames deve retornar dimensões com seus valores aninhados."""
    create_resp = await auth_client.post(
        "/graphql",
        json={
            "query": 'mutation { createVariationName(input: { name: "Numeração" }) { id } }'
        },
    )
    name_id = create_resp.json()["data"]["createVariationName"]["id"]

    await auth_client.post(
        "/graphql",
        json={
            "query": f'mutation {{ addVariationValue(input: {{ nameId: {name_id}, value: "42" }}) {{ id }} }}'
        },
    )

    list_resp = await auth_client.post(
        "/graphql",
        json={"query": "{ allVariationNames { id name values { id value } } }"},
    )
    data = list_resp.json()
    assert "errors" not in data, data.get("errors")
    dims = data["data"]["allVariationNames"]
    dim = next((d for d in dims if d["name"] == "Numeração"), None)
    assert dim is not None
    assert any(v["value"] == "42" for v in dim["values"])


@pytest.mark.asyncio
async def test_delete_variation_value(auth_client: AsyncClient):
    """deleteVariationValue deve remover o valor pelo ID."""
    create_resp = await auth_client.post(
        "/graphql",
        json={
            "query": 'mutation { createVariationName(input: { name: "Material" }) { id } }'
        },
    )
    name_id = create_resp.json()["data"]["createVariationName"]["id"]

    add_resp = await auth_client.post(
        "/graphql",
        json={
            "query": f'mutation {{ addVariationValue(input: {{ nameId: {name_id}, value: "Algodão" }}) {{ values {{ id value }} }} }}'
        },
    )
    value_id = add_resp.json()["data"]["addVariationValue"]["values"][0]["id"]

    del_resp = await auth_client.post(
        "/graphql",
        json={"query": f"mutation {{ deleteVariationValue(id: {value_id}) }}"},
    )
    del_data = del_resp.json()
    assert "errors" not in del_data, del_data.get("errors")
    assert del_data["data"]["deleteVariationValue"] is True


@pytest.mark.asyncio
async def test_delete_variation_name(auth_client: AsyncClient):
    """deleteVariationName deve remover a dimensão."""
    create_resp = await auth_client.post(
        "/graphql",
        json={
            "query": 'mutation { createVariationName(input: { name: "Voltagem" }) { id } }'
        },
    )
    name_id = create_resp.json()["data"]["createVariationName"]["id"]

    del_resp = await auth_client.post(
        "/graphql",
        json={"query": f"mutation {{ deleteVariationName(id: {name_id}) }}"},
    )
    del_data = del_resp.json()
    assert "errors" not in del_data, del_data.get("errors")
    assert del_data["data"]["deleteVariationName"] is True

    list_resp = await auth_client.post(
        "/graphql",
        json={"query": "{ allVariationNames { id name } }"},
    )
    dims = list_resp.json()["data"]["allVariationNames"]
    assert not any(d["id"] == name_id for d in dims)


@pytest.mark.asyncio
async def test_delete_variation_name_inexistente(auth_client: AsyncClient):
    """deleteVariationName com ID inexistente deve retornar erro GraphQL."""
    resp = await auth_client.post(
        "/graphql",
        json={"query": "mutation { deleteVariationName(id: 999999) }"},
    )
    data = resp.json()
    assert resp.status_code == 200
    assert "errors" in data
