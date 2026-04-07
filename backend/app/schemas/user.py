import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserMe(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    role: str
    password_is_temporary: bool = Field(validation_alias="is_temporary_password")
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class CreateTeacherRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    temporary_password: str


class TeacherResponse(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    password_is_temporary: bool = Field(validation_alias="is_temporary_password")
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}
