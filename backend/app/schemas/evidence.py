from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EvidenceResponse(BaseModel):
    id: int
    requirement_id: int
    filename: str
    content_type: str | None
    file_size: int | None
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)
