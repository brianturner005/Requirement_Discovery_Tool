from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Assumption(Base):
    __tablename__ = "assumptions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Open")
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="Medium")
    owner_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("stakeholders.id", ondelete="SET NULL"), nullable=True
    )
    related_requirement_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("requirements.id", ondelete="SET NULL"), nullable=True
    )
    resolution_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), server_default=func.now(), onupdate=func.now()
    )

    owner: Mapped["Stakeholder | None"] = relationship("Stakeholder")  # type: ignore[name-defined]  # noqa: F821
    related_requirement: Mapped["Requirement | None"] = relationship("Requirement")  # type: ignore[name-defined]  # noqa: F821
