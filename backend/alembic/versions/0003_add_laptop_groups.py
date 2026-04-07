"""add laptop_groups table

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "laptop_groups",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("building", sa.String(100), nullable=False),
        sa.Column("floor", sa.Integer(), nullable=False),
        sa.Column("laptop_count", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("building", "floor", name="uq_laptop_groups_building_floor"),
        sa.CheckConstraint("laptop_count > 0", name="ck_laptop_groups_count_positive"),
        sa.CheckConstraint("floor >= 0", name="ck_laptop_groups_floor_nonnegative"),
    )


def downgrade() -> None:
    op.drop_table("laptop_groups")
