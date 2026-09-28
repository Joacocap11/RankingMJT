"""create monsters table

Revision ID: 0001
Revises:
Create Date: 2026-09-28 00:00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "monsters",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nickname", sa.String(length=255), nullable=False),
        sa.Column("flavor", sa.String(length=255), nullable=False),
        sa.Column("rank_position", sa.Integer(), nullable=False),
        sa.Column("would_buy_again", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("image_path", sa.String(length=512), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("rank_position", name="uq_monster_rank_position"),
    )


def downgrade() -> None:
    op.drop_table("monsters")
