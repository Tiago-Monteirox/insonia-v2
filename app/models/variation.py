from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class VariationName(Base):
    """Nome de um atributo de variação (ex: Tamanho, Cor)."""

    __tablename__ = "nome_variacoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)

    values: Mapped[list["VariationValue"]] = relationship(
        back_populates="variation_name"
    )


class VariationValue(Base):
    """Valor concreto de um atributo de variação (ex: M, Azul)."""

    __tablename__ = "valor_variacoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name_id: Mapped[int] = mapped_column(ForeignKey("nome_variacoes.id"))
    value: Mapped[str] = mapped_column(String(100))

    variation_name: Mapped["VariationName"] = relationship(back_populates="values")

    __table_args__ = (UniqueConstraint("name_id", "value"),)


class Variation(Base):
    """Associação entre produto e um valor de variação específico."""

    __tablename__ = "variacoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("produtos.id", ondelete="CASCADE")
    )
    variation_value_id: Mapped[int] = mapped_column(ForeignKey("valor_variacoes.id"))

    __table_args__ = (UniqueConstraint("product_id", "variation_value_id"),)
