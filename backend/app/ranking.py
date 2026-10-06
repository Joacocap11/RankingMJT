"""Generic ranking service implementing the global rank_position algorithm.

Shared by every ranked entity (Monster, Beer, ...) that has an integer
``rank_position`` column with a plain ``UNIQUE(rank_position)`` constraint.
The algorithm itself is entity-agnostic: callers pass the SQLAlchemy model
class alongside the row being inserted/moved/deleted.

All shifting operations are executed one row at a time with an explicit
``db.flush()`` after each mutation so the SQL UPDATE statements hit the
database in the exact order required to never violate the UNIQUE constraint
(no deferred constraints needed):

- Insert at position P: existing rows with rank_position >= P shift +1,
  processed in DESCENDING rank_position order (highest first).
- Delete at position P: rows with rank_position > P shift -1, processed in
  ASCENDING rank_position order (lowest first).
- Move old -> new:
    new < old: rows in [new, old-1] shift +1, DESCENDING order.
    new > old: rows in [old+1, new] shift -1, ASCENDING order.
    new == old: no-op.

Callers (routers) catch ``RankingError`` and translate it into an HTTP 422
response with the message as ``detail``.
"""

from typing import Protocol, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Monster


class _RankedRow(Protocol):
    id: object
    rank_position: int


RowT = TypeVar("RowT", bound=_RankedRow)


class RankingError(Exception):
    """Raised when a requested rank_position is invalid or out of range."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


def get_count(db: Session, model: type[RowT]) -> int:
    return db.query(model).count()


def _shift_up_for_insert(db: Session, model: type[RowT], position: int) -> None:
    rows = (
        db.execute(
            select(model)
            .where(model.rank_position >= position)
            .order_by(model.rank_position.desc())
        )
        .scalars()
        .all()
    )
    for row in rows:
        row.rank_position += 1
        db.flush()


def _shift_down_for_delete(db: Session, model: type[RowT], position: int) -> None:
    rows = (
        db.execute(
            select(model)
            .where(model.rank_position > position)
            .order_by(model.rank_position.asc())
        )
        .scalars()
        .all()
    )
    for row in rows:
        row.rank_position -= 1
        db.flush()


def insert_entity(db: Session, model: type[RowT], entity: RowT, position: int) -> RowT:
    """Assign ``position`` to a not-yet-persisted ``entity``, shifting others."""
    count = get_count(db, model)
    if position < 1 or position > count + 1:
        raise RankingError(f"rank_position must be between 1 and {count + 1}")

    _shift_up_for_insert(db, model, position)

    entity.rank_position = position
    db.add(entity)
    db.flush()
    return entity


def delete_entity(db: Session, model: type[RowT], entity: RowT) -> None:
    """Delete ``entity`` and close the gap left in rank_position ordering."""
    position = entity.rank_position
    db.delete(entity)
    db.flush()
    _shift_down_for_delete(db, model, position)


def move_entity(db: Session, model: type[RowT], entity: RowT, new_position: int) -> RowT:
    """Move an existing, already-persisted ``entity`` to ``new_position``."""
    count = get_count(db, model)
    old_position = entity.rank_position

    if new_position < 1 or new_position > count:
        raise RankingError(f"rank_position must be between 1 and {count}")

    if new_position == old_position:
        return entity

    # Vacate the entity's current slot with an out-of-range sentinel value
    # first so the block shift below never collides with the entity's own
    # still-persisted old rank_position (no deferred constraints available).
    entity.rank_position = -1
    db.flush()

    if new_position < old_position:
        rows = (
            db.execute(
                select(model)
                .where(
                    model.rank_position >= new_position,
                    model.rank_position < old_position,
                    model.id != entity.id,
                )
                .order_by(model.rank_position.desc())
            )
            .scalars()
            .all()
        )
        for row in rows:
            row.rank_position += 1
            db.flush()
    else:
        rows = (
            db.execute(
                select(model)
                .where(
                    model.rank_position <= new_position,
                    model.rank_position > old_position,
                    model.id != entity.id,
                )
                .order_by(model.rank_position.asc())
            )
            .scalars()
            .all()
        )
        for row in rows:
            row.rank_position -= 1
            db.flush()

    entity.rank_position = new_position
    db.flush()
    return entity


# --- Monster convenience wrappers -------------------------------------------
# Kept so `app.routers.monsters` is untouched: same names, same signatures,
# behavior delegated to the generic functions above parameterized with
# Monster. Monster's own test suite (tests/test_ranking.py, test_images.py)
# exercises this exact path end-to-end.


def insert_monster(db: Session, monster: Monster, position: int) -> Monster:
    return insert_entity(db, Monster, monster, position)


def delete_monster(db: Session, monster: Monster) -> None:
    delete_entity(db, Monster, monster)


def move_monster(db: Session, monster: Monster, new_position: int) -> Monster:
    return move_entity(db, Monster, monster, new_position)
