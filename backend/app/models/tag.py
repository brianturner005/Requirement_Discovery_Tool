from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.associations import requirement_tags


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    requirements: Mapped[list["Requirement"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Requirement", secondary=requirement_tags, back_populates="tags"
    )
