from fastapi_users import schemas

class UserRead(schemas.BaseUser[int]):
    """Schema de leitura do usuário, exposto nas respostas da API."""
    username: str


class UserCreate(schemas.BaseUserCreate):
    """Schema de criação do usuário, usado para validação na criação."""
    username: str

class UserUpdate(schemas.BaseUserUpdate):
    """Schema de atualização do usuário, usado para validação na atualização."""
    username: str | None = None