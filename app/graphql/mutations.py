from decimal import Decimal

import strawberry
from slugify import slugify
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from strawberry.types import Info

from app.graphql.inputs import (
    BrandInput,
    CategoryInput,
    ProductInput,
    VariationNameInput,
    VariationValueInput,
)
from app.graphql.queries import product_model_to_type
from app.graphql.types import (
    BrandType,
    CategoryType,
    ProductType,
    VariationNameType,
    VariationValueType,
)
from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product
from app.models.sale import Sale
from app.models.variation import VariationName, VariationValue
from app.services.sale import create_sale as svc_create_sale
from app.services.sale import remove_sale


@strawberry.input
class SaleItemInput:
    """Input GraphQL para um item ao criar uma venda."""

    product_id: int
    quantity: int


@strawberry.type
class SaleResult:
    """Resultado retornado após criação de uma venda."""

    id: int
    total_amount: float
    total_profit: float


@strawberry.type
class Mutation:
    """Raiz de mutations GraphQL do projeto."""

    @strawberry.mutation
    async def create_sale(self, info: Info, items: list[SaleItemInput]) -> SaleResult:
        """Cria uma venda para o usuário autenticado com os itens informados."""
        db = info.context["db"]
        user = info.context["user"]

        try:
            sale = await svc_create_sale(db, user.id, items)
        except ValueError as e:
            raise strawberry.exceptions.graphql_error.GraphQLError(str(e))

        return SaleResult(
            id=sale.id,
            total_amount=float(sale.total_amount),
            total_profit=float(sale.total_profit),
        )

    # --- Produto ---

    @strawberry.mutation
    async def create_product(self, info: Info, input: ProductInput) -> ProductType:
        """Cria um novo produto com os dados informados."""
        db = info.context["db"]
        user = info.context["user"]
        if not user.is_superuser:
            raise strawberry.exceptions.GraphQLError(
                "Apenas administradores podem realizar esta operação"
            )

        product = Product(
            name=input.name,
            sale_price=Decimal(str(input.sale_price)),
            cost_price=Decimal(str(input.cost_price)),
            stock=input.stock,
            description=input.description,
            promotional_price=(
                Decimal(str(input.promotional_price))
                if input.promotional_price
                else None
            ),
            currency=input.currency,
            category_id=input.category_id,
            brand_id=input.brand_id,
        )
        db.add(product)
        await db.commit()
        await db.refresh(product)
        return product_model_to_type(product)

    @strawberry.mutation
    async def update_product(
        self, info: Info, id: int, input: ProductInput
    ) -> ProductType:
        """Atualiza os dados de um produto existente."""
        db = info.context["db"]
        user = info.context["user"]
        if not user.is_superuser:
            raise strawberry.exceptions.GraphQLError(
                "Apenas administradores podem realizar esta operação"
            )
        result = await db.execute(select(Product).where(Product.id == id))
        product = result.scalar_one_or_none()
        if product is None:
            raise strawberry.exceptions.graphql_error.GraphQLError(
                "Produto não encontrado"
            )
        product.name = input.name
        product.sale_price = Decimal(str(input.sale_price))
        product.cost_price = Decimal(str(input.cost_price))
        product.stock = input.stock
        product.description = input.description
        product.promotional_price = (
            Decimal(str(input.promotional_price)) if input.promotional_price else None
        )
        product.currency = input.currency
        product.category_id = input.category_id
        product.brand_id = input.brand_id
        product.slug = slugify(input.name)
        await db.commit()
        await db.refresh(product)
        return product_model_to_type(product)

    @strawberry.mutation
    async def delete_product(self, info: Info, id: int) -> bool:
        """Remove um produto pelo ID. Retorna True se deletado com sucesso."""
        db = info.context["db"]
        user = info.context["user"]
        if not user.is_superuser:
            raise strawberry.exceptions.GraphQLError(
                "Apenas administradores podem realizar esta operação"
            )
        result = await db.execute(select(Product).where(Product.id == id))
        product = result.scalar_one_or_none()
        if product is None:
            raise strawberry.exceptions.graphql_error.GraphQLError(
                "Produto não encontrado"
            )
        await db.delete(product)
        await db.commit()
        return True

    # --- Categoria ---

    @strawberry.mutation
    async def create_category(self, info: Info, input: CategoryInput) -> CategoryType:
        """Cria uma nova categoria."""
        db = info.context["db"]
        user = info.context["user"]
        if not user.is_superuser:
            raise strawberry.exceptions.GraphQLError(
                "Apenas administradores podem realizar esta operação"
            )
        category = Category(name=input.name)
        db.add(category)
        await db.commit()
        await db.refresh(category)
        return CategoryType(id=category.id, name=category.name, slug=category.slug)

    @strawberry.mutation
    async def update_category(
        self, info: Info, id: int, input: CategoryInput
    ) -> CategoryType:
        """Atualiza os dados de uma categoria existente."""
        db = info.context["db"]
        user = info.context["user"]
        if not user.is_superuser:
            raise strawberry.exceptions.GraphQLError(
                "Apenas administradores podem realizar esta operação"
            )
        result = await db.execute(select(Category).where(Category.id == id))
        category = result.scalar_one_or_none()
        if category is None:
            raise strawberry.exceptions.graphql_error.GraphQLError(
                "Categoria não encontrada"
            )
        category.name = input.name
        category.slug = slugify(input.name)
        await db.commit()
        await db.refresh(category)
        return CategoryType(id=category.id, name=category.name, slug=category.slug)

    @strawberry.mutation
    async def delete_category(self, info: Info, id: int) -> bool:
        """Remove uma categoria pelo ID. Retorna True se deletada com sucesso."""
        db = info.context["db"]
        user = info.context["user"]
        if not user.is_superuser:
            raise strawberry.exceptions.GraphQLError(
                "Apenas administradores podem realizar esta operação"
            )
        result = await db.execute(select(Category).where(Category.id == id))
        category = result.scalar_one_or_none()
        if category is None:
            raise strawberry.exceptions.graphql_error.GraphQLError(
                "Categoria não encontrada"
            )
        await db.delete(category)
        await db.commit()
        return True

    # --- Marca ---

    @strawberry.mutation
    async def create_brand(self, info: Info, input: BrandInput) -> BrandType:
        """Cria uma nova marca."""
        db = info.context["db"]
        user = info.context["user"]
        if not user.is_superuser:
            raise strawberry.exceptions.GraphQLError(
                "Apenas administradores podem realizar esta operação"
            )
        brand = Brand(name=input.name)
        db.add(brand)
        await db.commit()
        await db.refresh(brand)
        return BrandType(id=brand.id, name=brand.name, slug=brand.slug)

    @strawberry.mutation
    async def update_brand(self, info: Info, id: int, input: BrandInput) -> BrandType:
        """Atualiza os dados de uma marca existente."""
        db = info.context["db"]
        user = info.context["user"]
        if not user.is_superuser:
            raise strawberry.exceptions.GraphQLError(
                "Apenas administradores podem realizar esta operação"
            )
        result = await db.execute(select(Brand).where(Brand.id == id))
        brand = result.scalar_one_or_none()
        if brand is None:
            raise strawberry.exceptions.graphql_error.GraphQLError(
                "Marca não encontrada"
            )
        brand.name = input.name
        brand.slug = slugify(input.name)
        await db.commit()
        await db.refresh(brand)
        return BrandType(id=brand.id, name=brand.name, slug=brand.slug)

    @strawberry.mutation
    async def delete_brand(self, info: Info, id: int) -> bool:
        """Remove uma marca pelo ID. Retorna True se deletada com sucesso."""
        db = info.context["db"]
        user = info.context["user"]
        if not user.is_superuser:
            raise strawberry.exceptions.GraphQLError(
                "Apenas administradores podem realizar esta operação"
            )
        result = await db.execute(select(Brand).where(Brand.id == id))
        brand = result.scalar_one_or_none()
        if brand is None:
            raise strawberry.exceptions.graphql_error.GraphQLError(
                "Marca não encontrada"
            )
        await db.delete(brand)
        await db.commit()
        return True

    # --- Variações ---

    @strawberry.mutation
    async def create_variation_name(
        self, info: Info, input: VariationNameInput
    ) -> VariationNameType:
        """Cria uma dimensão de variação (ex: Tamanho, Cor)."""
        db = info.context["db"]
        vn = VariationName(name=input.name)
        db.add(vn)
        await db.commit()
        await db.refresh(vn)
        return VariationNameType(id=vn.id, name=vn.name, values=[])

    @strawberry.mutation
    async def add_variation_value(
        self, info: Info, input: VariationValueInput
    ) -> VariationNameType:
        """Adiciona um valor a uma dimensão existente. Retorna a dimensão atualizada."""
        db = info.context["db"]
        vv = VariationValue(name_id=input.name_id, value=input.value)
        db.add(vv)
        await db.commit()

        result = await db.execute(
            select(VariationName)
            .options(selectinload(VariationName.values))
            .where(VariationName.id == input.name_id)
        )
        vn = result.scalar_one()
        return VariationNameType(
            id=vn.id,
            name=vn.name,
            values=[VariationValueType(id=v.id, value=v.value) for v in vn.values],
        )

    @strawberry.mutation
    async def delete_variation_name(self, info: Info, id: int) -> bool:
        """Remove uma dimensão de variação e todos os seus valores."""
        db = info.context["db"]
        result = await db.execute(select(VariationName).where(VariationName.id == id))
        vn = result.scalar_one_or_none()
        if vn is None:
            raise strawberry.exceptions.GraphQLError("Dimensão não encontrada")
        await db.delete(vn)
        await db.commit()
        return True

    @strawberry.mutation
    async def delete_variation_value(self, info: Info, id: int) -> bool:
        """Remove um valor de variação pelo ID."""
        db = info.context["db"]
        result = await db.execute(select(VariationValue).where(VariationValue.id == id))
        vv = result.scalar_one_or_none()
        if vv is None:
            raise strawberry.exceptions.GraphQLError("Valor não encontrado")
        await db.delete(vv)
        await db.commit()
        return True

    # --- Venda ---

    @strawberry.mutation
    async def delete_sale(self, info: Info, id: int) -> bool:
        """Remove uma venda e restaura o estoque de todos os seus itens."""
        db = info.context["db"]
        user = info.context["user"]

        result = await db.execute(select(Sale).where(Sale.id == id))
        sale = result.scalar_one_or_none()
        if sale is None:
            raise strawberry.exceptions.graphql_error.GraphQLError(
                "Venda não encontrada"
            )
        if sale.user_id != user.id and not user.is_superuser:
            raise strawberry.exceptions.graphql_error.GraphQLError(
                "Sem permissão para deletar esta venda"
            )

        try:
            await remove_sale(db, id)
        except ValueError as e:
            raise strawberry.exceptions.graphql_error.GraphQLError(str(e))
        return True
