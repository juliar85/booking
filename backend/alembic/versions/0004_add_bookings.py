"""add bookings table

Revision ID: 0004
Revises: 0003
Create Date: 2026-04-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "bookings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "teacher_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "laptop_group_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("laptop_groups.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("booking_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("notes", sa.String(500), nullable=True),
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
        sa.CheckConstraint("start_time < end_time", name="ck_bookings_start_before_end"),
    )
    op.create_index("ix_bookings_teacher_id", "bookings", ["teacher_id"])
    op.create_index("ix_bookings_laptop_group_id", "bookings", ["laptop_group_id"])
    op.create_index("ix_bookings_booking_date", "bookings", ["booking_date"])


def downgrade() -> None:
    op.drop_index("ix_bookings_booking_date", table_name="bookings")
    op.drop_index("ix_bookings_laptop_group_id", table_name="bookings")
    op.drop_index("ix_bookings_teacher_id", table_name="bookings")
    op.drop_table("bookings")
