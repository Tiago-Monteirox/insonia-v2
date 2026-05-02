import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_e_login(client: AsyncClient):
    """Registrar e fazer login deve retornar access_token."""
    reg = await client.post(
        "/auth/register",
        json={
            "email": "novo@insonia.com",
            "username": "novousr",
            "password": "senha123",
        },
    )
    assert reg.status_code == 201, reg.text

    login = await client.post(
        "/auth/login",
        data={"username": "novo@insonia.com", "password": "senha123"},
    )
    assert login.status_code == 200
    assert "access_token" in login.json()


@pytest.mark.asyncio
async def test_rota_protegida_sem_token_retorna_401(client: AsyncClient):
    """Query GraphQL que requer auth deve retornar 401 sem token."""
    response = await client.post(
        "/graphql",
        json={"query": "{ allProducts { id } }"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_users_me_com_token(auth_client: AsyncClient):
    """GET /users/me com token válido deve retornar dados do usuário."""
    response = await auth_client.get("/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "teste@insonia.com"
    assert data["username"] == "testusr"


@pytest.mark.asyncio
async def test_token_invalido_retorna_401(client: AsyncClient):
    """Token inválido deve retornar 401."""
    response = await client.get(
        "/users/me",
        headers={"Authorization": "Bearer token-falso"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_registro_email_duplicado_retorna_400(client: AsyncClient):
    """Registrar o mesmo email duas vezes deve retornar 400."""
    payload = {
        "email": "dup@insonia.com",
        "username": "dupusr",
        "password": "senha123",
    }
    first = await client.post("/auth/register", json=payload)
    assert first.status_code == 201

    second = await client.post(
        "/auth/register",
        json={**payload, "username": "dupusr2"},
    )
    assert second.status_code == 400
