from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.common import DecisionStatusEnum
from app.schemas.requirement import RequirementSummary
from app.schemas.stakeholder import StakeholderSummary
from app.schemas.system import SystemSummary
from app.schemas.tag import TagResponse


class DecisionCreate(BaseModel):
    title: str
    description: str
    rationale: str
    status: DecisionStatusEnum = DecisionStatusEnum.PROPOSED
    decision_date: date | None = None
    alternatives_considered: str | None = None
    outcome: str | None = None
    made_by_id: int | None = None
    system_id: int | None = None
    tag_names: list[str] = []
    related_requirement_ids: list[int] = []

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Title must be at least 3 characters")
        return v

    @field_validator("tag_names")
    @classmethod
    def normalize_tags(cls, v: list[str]) -> list[str]:
        return [t.strip().lower() for t in v if t.strip()]


class DecisionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    rationale: str | None = None
    status: DecisionStatusEnum | None = None
    decision_date: date | None = None
    alternatives_considered: str | None = None
    outcome: str | None = None
    made_by_id: int | None = None
    system_id: int | None = None
    tag_names: list[str] | None = None
    related_requirement_ids: list[int] | None = None

    @field_validator("tag_names")
    @classmethod
    def normalize_tags(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            return [t.strip().lower() for t in v if t.strip()]
        return v


class DecisionResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    decision_date: date | None
    rationale: str
    alternatives_considered: str | None
    outcome: str | None
    made_by: StakeholderSummary | None
    system: SystemSummary | None
    tags: list[TagResponse]
    related_requirements: list[RequirementSummary]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
