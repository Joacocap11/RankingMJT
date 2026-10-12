from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, CheckConstraint, DateTime, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


# rating: NULL (sin puntuar) or 1.0..10.0 in exact 0.5 steps. Portable across
# PostgreSQL and SQLite: rating*2 must equal its integer cast (Numeric(3,1)).
RATING_CHECK_SQL = (
    "rating IS NULL OR (rating >= 1 AND rating <= 10 AND rating * 2 = CAST(rating * 2 AS INTEGER))"
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Monster(Base):
    __tablename__ = "monsters"
    __table_args__ = (
        UniqueConstraint("rank_position", name="uq_monster_rank_position"),
        CheckConstraint(RATING_CHECK_SQL, name="ck_monster_rating_half_steps"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nickname: Mapped[str] = mapped_column(String(255), nullable=False)
    flavor: Mapped[str] = mapped_column(String(255), nullable=False)
    rank_position: Mapped[int] = mapped_column(Integer, nullable=False)
    would_buy_again: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")
    image_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    thumbnail_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 1), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )


class Beer(Base):
    __tablename__ = "beers"
    __table_args__ = (
        UniqueConstraint("rank_position", name="uq_beer_rank_position"),
        CheckConstraint(RATING_CHECK_SQL, name="ck_beer_rating_half_steps"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    brand: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    rank_position: Mapped[int] = mapped_column(Integer, nullable=False)
    would_buy_again: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")
    image_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    thumbnail_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 1), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )


class Alfajor(Base):
    __tablename__ = "alfajores"
    __table_args__ = (
        UniqueConstraint("rank_position", name="uq_alfajor_rank_position"),
        CheckConstraint(RATING_CHECK_SQL, name="ck_alfajor_rating_half_steps"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    brand: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    rank_position: Mapped[int] = mapped_column(Integer, nullable=False)
    would_buy_again: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")
    image_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    thumbnail_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 1), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )
