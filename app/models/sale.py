from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Sale(Base):
    """Registro de uma venda com totais calculados."""

    __tablename__ = "vendas"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    sale_date: Mapped[datetime] = mapped_column(DateTime, server_default=func.now)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    total_profit: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)

    items: Mapped[list["SaleItem"]] = relationship(
        back_populates="sale", cascade="all, delete-orphan"
    )


class SaleItem(Base):
    """Item individual de uma venda, com preço e custo no momento da compra."""

    __tablename__ = "itens_venda"

    id: Mapped[int] = mapped_column(primary_key=True)
    sale_id: Mapped[int] = mapped_column(ForeignKey("vendas.id", ondelete="CASCADE"))
    product_id: Mapped[int] = mapped_column(
        ForeignKey("produtos.id", ondelete="RESTRICT")
    )
    quantity: Mapped[int]
    sale_price: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    cost_price: Mapped[Decimal] = mapped_column(Numeric(14, 2))

    sale: Mapped["Sale"] = relationship(back_populates="items")
