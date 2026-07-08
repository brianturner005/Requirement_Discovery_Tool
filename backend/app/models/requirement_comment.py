from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RequirementComment(Base):
    __tablename__ = "requirement_comments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    requirement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), server_default=func.now(), onupdate=func.now()
    )

    requirement: Mapped["Requirement"] = relationship("Requirement")  # type: ignore[name-defined]  # noqa: F821
    author: Mapped["User | None"] = relationship("User")  # type: ignore[name-defined]  # noqa: F821
