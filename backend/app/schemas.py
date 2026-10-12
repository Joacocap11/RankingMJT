from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Annotated, Any

from pydantic import BaseModel, BeforeValidator, ConfigDict, PlainSerializer


def _validate_rating(value: Any) -> Decimal | None:
    """None, or a number in 1.0..10.0 in exact 0.5 steps."""
    if value is None:
        return None
    if isinstance(value, bool):
        raise ValueError("rating must be a number")
    try:
        rating = Decimal(str(value).strip())
    except InvalidOperation as exc:
        raise ValueError("rating must be a number") from exc
    if not rating.is_finite():
        raise ValueError("rating must be a finite number")
    if rating < 1 or rating > 10:
        raise ValueError("rating must be between 1.0 and 10.0")
    if (rating * 2) != (rating * 2).to_integral_value():
        raise ValueError("rating must be in steps of 0.5")
    return rating


# Serialized as a JSON number (8.5), not a Decimal string ("8.5"). Halves are
# exactly representable as floats.
Rating = Annotated[
    Decimal | None,
    BeforeValidator(_validate_rating),
    PlainSerializer(lambda v: None if v is None else float(v), return_type=float | None, when_used="json"),
]


class MonsterBase(BaseModel):
    nickname: str
    flavor: str
    would_buy_again: bool = True
    rating: Rating = None
    notes: str | None = None


class MonsterCreate(MonsterBase):
    rank_position: int


class MonsterUpdate(BaseModel):
    nickname: str | None = None
    flavor: str | None = None
    rank_position: int | None = None
    would_buy_again: bool | None = None
    rating: Rating = None
    notes: str | None = None


class MonsterRankUpdate(BaseModel):
    rank_position: int


class MonsterOut(MonsterBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    rank_position: int
    image_path: str | None = None
    thumbnail_path: str | None = None
    created_at: datetime
    updated_at: datetime


class BeerBase(BaseModel):
    brand: str
    name: str
    would_buy_again: bool = True
    rating: Rating = None
    notes: str | None = None


class BeerCreate(BeerBase):
    rank_position: int


class BeerUpdate(BaseModel):
    brand: str | None = None
    name: str | None = None
    rank_position: int | None = None
    would_buy_again: bool | None = None
    rating: Rating = None
    notes: str | None = None


class BeerRankUpdate(BaseModel):
    rank_position: int


class BeerOut(BeerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    rank_position: int
    image_path: str | None = None
    thumbnail_path: str | None = None
    created_at: datetime
    updated_at: datetime


class AlfajorBase(BaseModel):
    brand: str
    name: str
    would_buy_again: bool = True
    rating: Rating = None
    notes: str | None = None


class AlfajorCreate(AlfajorBase):
    rank_position: int


class AlfajorUpdate(BaseModel):
    brand: str | None = None
    name: str | None = None
    rank_position: int | None = None
    would_buy_again: bool | None = None
    rating: Rating = None
    notes: str | None = None


class AlfajorRankUpdate(BaseModel):
    rank_position: int


class AlfajorOut(AlfajorBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    rank_position: int
    image_path: str | None = None
    thumbnail_path: str | None = None
    created_at: datetime
    updated_at: datetime
