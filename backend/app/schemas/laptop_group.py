import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class LaptopGroupCreate(BaseModel):
    building: str
    floor: int
    laptop_count: int

    @field_validator("floor")
    @classmethod
    def floor_nonnegative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("floor must be >= 0")
        return v

    @field_validator("laptop_count")
    @classmethod
    def laptop_count_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("laptop_count must be >= 1")
        return v


class LaptopGroupUpdate(BaseModel):
    building: str | None = None
    floor: int | None = None
    laptop_count: int | None = None

    @field_validator("floor")
    @classmethod
    def floor_nonnegative(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("floor must be >= 0")
        return v

    @field_validator("laptop_count")
    @classmethod
    def laptop_count_positive(cls, v: int | None) -> int | None:
        if v is not None and v < 1:
            raise ValueError("laptop_count must be >= 1")
        return v


class LaptopGroupResponse(BaseModel):
    id: uuid.UUID
    building: str
    floor: int
    laptop_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
