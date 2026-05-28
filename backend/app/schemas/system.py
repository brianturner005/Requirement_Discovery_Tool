from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class SystemBase(BaseModel):
    name: str
    description: str | None = None
    system_type: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class SystemCreate(SystemBase):
    pass


class SystemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    system_type: str | None = None


class SystemResponse(BaseModel):
    id: int
    name: str
    description: str | None
    system_type: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SystemSummary(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)
