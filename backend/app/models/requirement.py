from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.associations import requirement_relations, requirement_tags


class Requirement(Base):
    __tablename__ = "requirements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    req_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    stakeholder_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("stakeholders.id", ondelete="SET NULL"), nullable=True
    )
    system_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("systems.id", ondelete="SET NULL"), nullable=True
    )
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="Medium")
    confidence: Mapped[str] = mapped_column(String(20), nullable=False, default="Unknown")
    business_impact: Mapped[str | None] = mapped_column(Text, nullable=True)
    technical_impact: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Draft")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), server_default=func.now(), onupdate=func.now()
    )

    stakeholder: Mapped["Stakeholder | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Stakeholder", back_populates="requirements"
    )
    system: Mapped["System | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "System", back_populates="requirements"
    )
    tags: Mapped[list["Tag"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Tag", secondary=requirement_tags, back_populates="requirements"
    )
    related_to: Mapped[list["Requirement"]] = relationship(
        "Requirement",
        secondary=requirement_relations,
        primaryjoin=id == requirement_relations.c.source_id,
        secondaryjoin=id == requirement_relations.c.target_id,
        lazy="selectin",
    )
    related_from: Mapped[list["Requirement"]] = relationship(
        "Requirement",
        secondary=requirement_relations,
        primaryjoin=id == requirement_relations.c.target_id,
        secondaryjoin=id == requirement_relations.c.source_id,
        lazy="selectin",
        overlaps="related_to",
    )
    evidence: Mapped[list["Evidence"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Evidence", back_populates="requirement", cascade="all, delete-orphan"
    )
