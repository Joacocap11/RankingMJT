from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Monster(Base):
    __tablename__ = "monsters"
    __table_args__ = (UniqueConstraint("rank_position", name="uq_monster_rank_position"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nickname: Mapped[str] = mapped_column(String(255), nullable=False)
    flavor: Mapped[str] = mapped_column(String(255), nullable=False)
    rank_position: Mapped[int] = mapped_column(Integer, nullable=False)
    would_buy_again: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")
    image_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )
