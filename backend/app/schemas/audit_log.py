from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserSummary


class AuditLogResponse(BaseModel):
    id: int
    requirement_id: int
    changed_by: UserSummary | None
    from_status: str
    to_status: str
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)
