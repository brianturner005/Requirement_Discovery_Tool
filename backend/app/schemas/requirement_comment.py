from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserSummary


class CommentCreate(BaseModel):
    body: str


class CommentUpdate(BaseModel):
    body: str


class CommentResponse(BaseModel):
    id: int
    requirement_id: int
    author: UserSummary | None
    body: str
    is_edited: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
