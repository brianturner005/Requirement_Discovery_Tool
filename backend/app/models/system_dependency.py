from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SystemDependency(Base):
    __tablename__ = "system_dependencies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    source_system_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("systems.id", ondelete="CASCADE"), nullable=False
    )
    target_system_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("systems.id", ondelete="CASCADE"), nullable=False
    )
    dependency_type: Mapped[str] = mapped_column(String(100), nullable=False, default="Depends On")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), server_default=func.now())

    source_system: Mapped["System"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "System", foreign_keys=[source_system_id]
    )
    target_system: Mapped["System"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "System", foreign_keys=[target_system_id]
    )
