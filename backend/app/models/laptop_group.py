import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, CheckConstraint, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LaptopGroup(Base):
    __tablename__ = "laptop_groups"
    __table_args__ = (
        UniqueConstraint("building", "floor", name="uq_laptop_groups_building_floor"),
        CheckConstraint("laptop_count > 0", name="ck_laptop_groups_count_positive"),
        CheckConstraint("floor >= 0", name="ck_laptop_groups_floor_nonnegative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    building: Mapped[str] = mapped_column(String(100), nullable=False)
    floor: Mapped[int] = mapped_column(Integer, nullable=False)
    laptop_count: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    bookings: Mapped[list["Booking"]] = relationship(  # noqa: F821
        "Booking", back_populates="laptop_group", cascade="all, delete-orphan"
    )
