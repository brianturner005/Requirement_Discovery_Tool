from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.common import ConfidenceEnum, PriorityEnum, SourceEnum, StatusEnum
from app.schemas.evidence import EvidenceResponse
from app.schemas.stakeholder import StakeholderSummary
from app.schemas.system import SystemSummary
from app.schemas.tag import TagResponse


class RequirementSummary(BaseModel):
    id: int
    req_id: str
    title: str
    status: str
    priority: str

    model_config = ConfigDict(from_attributes=True)


class RequirementCreate(BaseModel):
    title: str
    description: str
    source: SourceEnum
    stakeholder_id: int | None = None
    system_id: int | None = None
    priority: PriorityEnum = PriorityEnum.MEDIUM
    confidence: ConfidenceEnum = ConfidenceEnum.UNKNOWN
    business_impact: str | None = None
    technical_impact: str | None = None
    notes: str | None = None
    tag_names: list[str] = []
    related_req_ids: list[str] = []

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Title must be at least 3 characters")
        if len(v) > 500:
            raise ValueError("Title must be at most 500 characters")
        return v

    @field_validator("description")
    @classmethod
    def description_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 10:
            raise ValueError("Description must be at least 10 characters")
        return v

    @field_validator("tag_names")
    @classmethod
    def normalize_tags(cls, v: list[str]) -> list[str]:
        return [t.strip().lower() for t in v if t.strip()]

    @field_validator("related_req_ids")
    @classmethod
    def validate_req_ids(cls, v: list[str]) -> list[str]:
        for req_id in v:
            if not req_id.startswith("REQ-"):
                raise ValueError(f"Invalid requirement ID format: {req_id}")
        return v


class RequirementUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    source: SourceEnum | None = None
    stakeholder_id: int | None = None
    system_id: int | None = None
    priority: PriorityEnum | None = None
    confidence: ConfidenceEnum | None = None
    business_impact: str | None = None
    technical_impact: str | None = None
    status: StatusEnum | None = None
    notes: str | None = None
    tag_names: list[str] | None = None
    related_req_ids: list[str] | None = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if len(v) < 3:
                raise ValueError("Title must be at least 3 characters")
        return v

    @field_validator("tag_names")
    @classmethod
    def normalize_tags(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            return [t.strip().lower() for t in v if t.strip()]
        return v


class StatusTransition(BaseModel):
    status: StatusEnum


class RequirementResponse(BaseModel):
    id: int
    req_id: str
    title: str
    description: str
    source: str
    stakeholder: StakeholderSummary | None
    system: SystemSummary | None
    priority: str
    confidence: str
    business_impact: str | None
    technical_impact: str | None
    status: str
    notes: str | None
    tags: list[TagResponse]
    related_requirements: list[RequirementSummary]
    evidence: list[EvidenceResponse]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
