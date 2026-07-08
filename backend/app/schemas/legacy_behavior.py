from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.common import BehaviorStatusEnum, BehaviorTypeEnum, PriorityEnum
from app.schemas.requirement import RequirementSummary
from app.schemas.system import SystemSummary


class LegacyBehaviorCreate(BaseModel):
    title: str
    description: str
    behavior_type: BehaviorTypeEnum
    severity: PriorityEnum = PriorityEnum.MEDIUM
    status: BehaviorStatusEnum = BehaviorStatusEnum.DOCUMENTED
    system_id: int | None = None
    related_requirement_id: int | None = None
    steps_to_reproduce: str | None = None
    expected_behavior: str | None = None
    actual_behavior: str | None = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Title must be at least 3 characters")
        return v


class LegacyBehaviorUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    behavior_type: BehaviorTypeEnum | None = None
    severity: PriorityEnum | None = None
    status: BehaviorStatusEnum | None = None
    system_id: int | None = None
    related_requirement_id: int | None = None
    steps_to_reproduce: str | None = None
    expected_behavior: str | None = None
    actual_behavior: str | None = None


class LegacyBehaviorResponse(BaseModel):
    id: int
    title: str
    description: str
    behavior_type: str
    severity: str
    status: str
    system: SystemSummary | None
    related_requirement: RequirementSummary | None
    steps_to_reproduce: str | None
    expected_behavior: str | None
    actual_behavior: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
