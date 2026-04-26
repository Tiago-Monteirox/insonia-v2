from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import SlugMixin


class Product(SlugMixin, Base):
    """Modelo de produto com preços, estoque e imagens."""

    __tablename__ = "produtos"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(220), unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    stock: Mapped[int] = mapped_column(default=0)

    # Preços como Numeric — armazena centavos com precisão
    sale_price: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    cost_price: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    promotional_price: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))

    currency: Mapped[str] = mapped_column(String(3), default="BRL")

    category_id: Mapped[int | None] = mapped_column(ForeignKey("categorias.id"))
    brand_id: Mapped[int | None] = mapped_column(ForeignKey("marcas.id"))

    images: Mapped[list["ProductImage"]] = relationship(back_populates="product")


class ProductImage(Base):
    """Modelo de imagem associada a um produto."""

    __tablename__ = "produto_imagens"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("produtos.id", ondelete="CASCADE")
    )
    path: Mapped[str] = mapped_column(String(500))

    product: Mapped["Product"] = relationship(back_populates="images")
