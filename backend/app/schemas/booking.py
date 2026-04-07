import uuid
from datetime import date, datetime, time

from pydantic import BaseModel, field_validator, model_validator


class BookingCreate(BaseModel):
    laptop_group_id: uuid.UUID
    booking_date: date
    start_time: time
    end_time: time
    notes: str | None = None

    @field_validator("start_time", "end_time", mode="after")
    @classmethod
    def align_to_15_minutes(cls, v: time) -> time:
        if v.minute % 15 != 0 or v.second != 0 or v.microsecond != 0:
            raise ValueError("Times must align to 15-minute boundaries (00, 15, 30, 45)")
        return v

    @model_validator(mode="after")
    def start_before_end(self) -> "BookingCreate":
        if self.start_time >= self.end_time:
            raise ValueError("start_time must be before end_time")
        return self


class BookingUpdate(BaseModel):
    booking_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    notes: str | None = None

    @field_validator("start_time", "end_time", mode="after")
    @classmethod
    def align_to_15_minutes(cls, v: time | None) -> time | None:
        if v is not None and (v.minute % 15 != 0 or v.second != 0 or v.microsecond != 0):
            raise ValueError("Times must align to 15-minute boundaries (00, 15, 30, 45)")
        return v

    @model_validator(mode="after")
    def start_before_end_if_both(self) -> "BookingUpdate":
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValueError("start_time must be before end_time")
        return self


class TeacherSummary(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    email: str

    model_config = {"from_attributes": True}


class LaptopGroupSummary(BaseModel):
    id: uuid.UUID
    building: str
    floor: int
    laptop_count: int

    model_config = {"from_attributes": True}


class BookingResponse(BaseModel):
    id: uuid.UUID
    teacher_id: uuid.UUID
    laptop_group_id: uuid.UUID
    teacher: TeacherSummary
    laptop_group: LaptopGroupSummary
    booking_date: date
    start_time: time
    end_time: time
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
