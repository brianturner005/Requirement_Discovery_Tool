from enum import Enum
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class SourceEnum(str, Enum):
    SME_INTERVIEW = "SME Interview"
    EXISTING_DOCUMENTATION = "Existing Documentation"
    PRODUCTION_OBSERVATION = "Production Observation"
    LEGACY_CODE_ANALYSIS = "Legacy Code Analysis"
    OPERATIONAL_WORKFLOW = "Operational Workflow"
    INCIDENT_INVESTIGATION = "Incident Investigation"
    USER_REQUEST = "User Request"
    ASSUMPTION = "Assumption"
    REVERSE_ENGINEERING = "Reverse Engineering"


class PriorityEnum(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class ConfidenceEnum(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    UNKNOWN = "Unknown"


class StatusEnum(str, Enum):
    DRAFT = "Draft"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    DEFERRED = "Deferred"


VALID_TRANSITIONS: dict[StatusEnum, list[StatusEnum]] = {
    StatusEnum.DRAFT: [StatusEnum.UNDER_REVIEW],
    StatusEnum.UNDER_REVIEW: [StatusEnum.APPROVED, StatusEnum.REJECTED, StatusEnum.DRAFT],
    StatusEnum.APPROVED: [StatusEnum.IN_PROGRESS, StatusEnum.DEFERRED],
    StatusEnum.REJECTED: [StatusEnum.DRAFT],
    StatusEnum.IN_PROGRESS: [StatusEnum.COMPLETED, StatusEnum.DEFERRED],
    StatusEnum.DEFERRED: [StatusEnum.DRAFT, StatusEnum.UNDER_REVIEW],
    StatusEnum.COMPLETED: [],
}


class DecisionStatusEnum(str, Enum):
    PROPOSED = "Proposed"
    ACCEPTED = "Accepted"
    SUPERSEDED = "Superseded"
    REJECTED = "Rejected"


class AssumptionCategoryEnum(str, Enum):
    ASSUMPTION = "Assumption"
    OPEN_QUESTION = "Open Question"
    INVESTIGATION_TASK = "Investigation Task"
    RISK = "Risk"


class AssumptionStatusEnum(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    VALIDATED = "Validated"
    INVALIDATED = "Invalidated"
    CLOSED = "Closed"


class BehaviorTypeEnum(str, Enum):
    EDGE_CASE = "Edge Case"
    WORKAROUND = "Workaround"
    UNDOCUMENTED_BEHAVIOR = "Undocumented Behavior"
    KNOWN_BUG = "Known Bug"
    MANUAL_PROCESS = "Manual Process"


class BehaviorStatusEnum(str, Enum):
    DOCUMENTED = "Documented"
    INVESTIGATING = "Investigating"
    ADDRESSED = "Addressed"
    ACCEPTED_RISK = "Accepted Risk"


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int
