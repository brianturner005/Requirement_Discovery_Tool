from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class StakeholderBase(BaseModel):
    name: str
    email: str | None = None
    role: str | None = None
    department: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str | None) -> str | None:
        if v is None or v.strip() == "":
            return None
        # Basic email validation without external dependency
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email format")
        return v


class StakeholderCreate(StakeholderBase):
    pass


class StakeholderUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    role: str | None = None
    department: str | None = None


class StakeholderResponse(BaseModel):
    id: int
    name: str
    email: str | None
    role: str | None
    department: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StakeholderSummary(BaseModel):
    id: int
    name: str
    email: str | None

    model_config = ConfigDict(from_attributes=True)
