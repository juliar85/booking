"""replace username with email, first_name, last_name

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns as nullable first
    op.add_column("users", sa.Column("email", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("first_name", sa.String(100), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(100), nullable=True))

    # Migrate existing data: use username as email, split on dot for names
    op.execute("""
        UPDATE users
        SET email = username,
            first_name = SPLIT_PART(username, '.', 1),
            last_name = COALESCE(NULLIF(SPLIT_PART(username, '.', 2), ''), username)
    """)

    # Set NOT NULL and add unique constraint
    op.alter_column("users", "email", nullable=False)
    op.alter_column("users", "first_name", nullable=False)
    op.alter_column("users", "last_name", nullable=False)
    op.create_unique_constraint("uq_users_email", "users", ["email"])

    # Drop old column
    op.drop_constraint("uq_users_username", "users", type_="unique")
    op.drop_column("users", "username")


def downgrade() -> None:
    op.add_column("users", sa.Column("username", sa.String(100), nullable=True))
    op.execute("UPDATE users SET username = email")
    op.alter_column("users", "username", nullable=False)
    op.create_unique_constraint("uq_users_username", "users", ["username"])
    op.drop_constraint("uq_users_email", "users", type_="unique")
    op.drop_column("users", "email")
    op.drop_column("users", "first_name")
    op.drop_column("users", "last_name")
