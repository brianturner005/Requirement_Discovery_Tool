from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.common import DefectStatusEnum, PriorityEnum
from app.schemas.requirement import RequirementSummary
from app.schemas.system import SystemSummary


class DefectCreate(BaseModel):
    title: str
    description: str
    severity: PriorityEnum = PriorityEnum.MEDIUM
    status: DefectStatusEnum = DefectStatusEnum.OPEN
    requirement_id: int | None = None
    system_id: int | None = None
    steps_to_reproduce: str | None = None
    environment: str | None = None
    resolution_notes: str | None = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Title must be at least 3 characters")
        return v


class DefectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    severity: PriorityEnum | None = None
    status: DefectStatusEnum | None = None
    requirement_id: int | None = None
    system_id: int | None = None
    steps_to_reproduce: str | None = None
    environment: str | None = None
    resolution_notes: str | None = None


class DefectResponse(BaseModel):
    id: int
    title: str
    description: str
    severity: str
    status: str
    requirement: RequirementSummary | None
    system: SystemSummary | None
    steps_to_reproduce: str | None
    environment: str | None
    resolution_notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
