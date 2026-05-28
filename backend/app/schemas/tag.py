from pydantic import BaseModel, ConfigDict, field_validator


class TagCreate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def normalize(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("Tag name cannot be empty")
        if len(v) > 100:
            raise ValueError("Tag name too long (max 100 chars)")
        return v


class TagResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)
