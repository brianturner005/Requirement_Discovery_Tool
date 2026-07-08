from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserSummary


class VersionResponse(BaseModel):
    id: int
    requirement_id: int
    changed_by: UserSummary | None
    version_num: int
    snapshot: dict
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)
