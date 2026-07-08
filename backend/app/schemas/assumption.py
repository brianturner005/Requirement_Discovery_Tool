from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.common import AssumptionCategoryEnum, AssumptionStatusEnum, PriorityEnum
from app.schemas.requirement import RequirementSummary
from app.schemas.stakeholder import StakeholderSummary


class AssumptionCreate(BaseModel):
    title: str
    description: str
    category: AssumptionCategoryEnum
    status: AssumptionStatusEnum = AssumptionStatusEnum.OPEN
    priority: PriorityEnum = PriorityEnum.MEDIUM
    owner_id: int | None = None
    related_requirement_id: int | None = None
    resolution_notes: str | None = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Title must be at least 3 characters")
        return v


class AssumptionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: AssumptionCategoryEnum | None = None
    status: AssumptionStatusEnum | None = None
    priority: PriorityEnum | None = None
    owner_id: int | None = None
    related_requirement_id: int | None = None
    resolution_notes: str | None = None


class AssumptionResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    status: str
    priority: str
    owner: StakeholderSummary | None
    related_requirement: RequirementSummary | None
    resolution_notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
