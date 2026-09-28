"""Pure ranking service functions implementing the global rank_position algorithm.

All shifting operations are executed one row at a time with an explicit
``db.flush()`` after each mutation so the SQL UPDATE statements hit the
database in the exact order required to never violate the plain
UNIQUE(rank_position) constraint (no deferred constraints needed):

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

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Monster


class RankingError(Exception):
    """Raised when a requested rank_position is invalid or out of range."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


def get_count(db: Session) -> int:
    return db.query(Monster).count()


def _shift_up_for_insert(db: Session, position: int) -> None:
    rows = (
        db.execute(
            select(Monster)
            .where(Monster.rank_position >= position)
            .order_by(Monster.rank_position.desc())
        )
        .scalars()
        .all()
    )
    for row in rows:
        row.rank_position += 1
        db.flush()


def _shift_down_for_delete(db: Session, position: int) -> None:
    rows = (
        db.execute(
            select(Monster)
            .where(Monster.rank_position > position)
            .order_by(Monster.rank_position.asc())
        )
        .scalars()
        .all()
    )
    for row in rows:
        row.rank_position -= 1
        db.flush()


def insert_monster(db: Session, monster: Monster, position: int) -> Monster:
    """Assign ``position`` to a not-yet-persisted ``monster``, shifting others."""
    count = get_count(db)
    if position < 1 or position > count + 1:
        raise RankingError(f"rank_position must be between 1 and {count + 1}")

    _shift_up_for_insert(db, position)

    monster.rank_position = position
    db.add(monster)
    db.flush()
    return monster


def delete_monster(db: Session, monster: Monster) -> None:
    """Delete ``monster`` and close the gap left in rank_position ordering."""
    position = monster.rank_position
    db.delete(monster)
    db.flush()
    _shift_down_for_delete(db, position)


def move_monster(db: Session, monster: Monster, new_position: int) -> Monster:
    """Move an existing, already-persisted ``monster`` to ``new_position``."""
    count = get_count(db)
    old_position = monster.rank_position

    if new_position < 1 or new_position > count:
        raise RankingError(f"rank_position must be between 1 and {count}")

    if new_position == old_position:
        return monster

    # Vacate the monster's current slot with an out-of-range sentinel value
    # first so the block shift below never collides with the monster's own
    # still-persisted old rank_position (no deferred constraints available).
    monster.rank_position = -1
    db.flush()

    if new_position < old_position:
        rows = (
            db.execute(
                select(Monster)
                .where(
                    Monster.rank_position >= new_position,
                    Monster.rank_position < old_position,
                    Monster.id != monster.id,
                )
                .order_by(Monster.rank_position.desc())
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
                select(Monster)
                .where(
                    Monster.rank_position <= new_position,
                    Monster.rank_position > old_position,
                    Monster.id != monster.id,
                )
                .order_by(Monster.rank_position.asc())
            )
            .scalars()
            .all()
        )
        for row in rows:
            row.rank_position -= 1
            db.flush()

    monster.rank_position = new_position
    db.flush()
    return monster
