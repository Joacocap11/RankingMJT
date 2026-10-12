"""add optional half-point rating to monsters, beers and alfajores

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-12 00:00:00

rating is NUMERIC(3,1), NULL = sin puntuar. Existing rows stay NULL.
Allowed: NULL or 1.0..10.0 in exact 0.5 steps.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

RATING_CHECK_SQL = (
    "rating IS NULL OR (rating >= 1 AND rating <= 10 AND rating * 2 = CAST(rating * 2 AS INTEGER))"
)

TABLES = (("monsters", "monster"), ("beers", "beer"), ("alfajores", "alfajor"))


def upgrade() -> None:
    for table, short in TABLES:
        op.add_column(table, sa.Column("rating", sa.Numeric(3, 1), nullable=True))
        op.create_check_constraint(f"ck_{short}_rating_half_steps", table, RATING_CHECK_SQL)


def downgrade() -> None:
    for table, short in TABLES:
        op.drop_constraint(f"ck_{short}_rating_half_steps", table, type_="check")
        op.drop_column(table, "rating")
