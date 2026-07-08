from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.associations import decision_requirements, decision_tags


class Decision(Base):
    __tablename__ = "decisions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Proposed")
    decision_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    alternatives_considered: Mapped[str | None] = mapped_column(Text, nullable=True)
    outcome: Mapped[str | None] = mapped_column(Text, nullable=True)
    made_by_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("stakeholders.id", ondelete="SET NULL"), nullable=True
    )
    system_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("systems.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), server_default=func.now(), onupdate=func.now()
    )

    made_by: Mapped["Stakeholder | None"] = relationship("Stakeholder")  # type: ignore[name-defined]  # noqa: F821
    system: Mapped["System | None"] = relationship("System")  # type: ignore[name-defined]  # noqa: F821
    tags: Mapped[list["Tag"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Tag", secondary=decision_tags, back_populates="decisions"
    )
    related_requirements: Mapped[list["Requirement"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Requirement", secondary=decision_requirements
    )
