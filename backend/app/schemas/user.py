from pydantic import BaseModel, ConfigDict


class UserSummary(BaseModel):
    id: int
    full_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)
