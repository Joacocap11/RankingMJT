from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MonsterBase(BaseModel):
    nickname: str
    flavor: str
    would_buy_again: bool = True
    notes: str | None = None


class MonsterCreate(MonsterBase):
    rank_position: int


class MonsterUpdate(BaseModel):
    nickname: str | None = None
    flavor: str | None = None
    rank_position: int | None = None
    would_buy_again: bool | None = None
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
    notes: str | None = None


class BeerCreate(BeerBase):
    rank_position: int


class BeerUpdate(BaseModel):
    brand: str | None = None
    name: str | None = None
    rank_position: int | None = None
    would_buy_again: bool | None = None
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
    notes: str | None = None


class AlfajorCreate(AlfajorBase):
    rank_position: int


class AlfajorUpdate(BaseModel):
    brand: str | None = None
    name: str | None = None
    rank_position: int | None = None
    would_buy_again: bool | None = None
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
