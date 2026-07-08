from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.common import TestCaseStatusEnum
from app.schemas.requirement import RequirementSummary


class TestCaseCreate(BaseModel):
    title: str
    description: str | None = None
    preconditions: str | None = None
    steps: str
    expected_result: str
    status: TestCaseStatusEnum = TestCaseStatusEnum.DRAFT
    requirement_id: int | None = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Title must be at least 3 characters")
        return v


class TestCaseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    preconditions: str | None = None
    steps: str | None = None
    expected_result: str | None = None
    status: TestCaseStatusEnum | None = None
    requirement_id: int | None = None


class TestCaseResponse(BaseModel):
    id: int
    title: str
    description: str | None
    preconditions: str | None
    steps: str
    expected_result: str
    status: str
    requirement: RequirementSummary | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
