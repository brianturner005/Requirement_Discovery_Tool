from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Defect(Base):
    __tablename__ = "defects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(50), nullable=False, default="Medium")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Open")
    requirement_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("requirements.id", ondelete="SET NULL"), nullable=True
    )
    system_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("systems.id", ondelete="SET NULL"), nullable=True
    )
    steps_to_reproduce: Mapped[str | None] = mapped_column(Text, nullable=True)
    environment: Mapped[str | None] = mapped_column(String(200), nullable=True)
    resolution_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), server_default=func.now(), onupdate=func.now()
    )

    requirement: Mapped["Requirement | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Requirement", foreign_keys=[requirement_id]
    )
    system: Mapped["System | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "System", foreign_keys=[system_id]
    )
