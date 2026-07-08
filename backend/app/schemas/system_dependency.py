from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.common import DependencyTypeEnum
from app.schemas.system import SystemSummary


class SystemDependencyCreate(BaseModel):
    source_system_id: int
    target_system_id: int
    dependency_type: DependencyTypeEnum = DependencyTypeEnum.DEPENDS_ON
    notes: str | None = None


class SystemDependencyUpdate(BaseModel):
    dependency_type: DependencyTypeEnum | None = None
    notes: str | None = None


class SystemDependencyResponse(BaseModel):
    id: int
    source_system: SystemSummary
    target_system: SystemSummary
    dependency_type: str
    notes: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
