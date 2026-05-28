from sqlalchemy import Column, ForeignKey, Integer, Table

from app.database import Base

requirement_tags = Table(
    "requirement_tags",
    Base.metadata,
    Column("requirement_id", Integer, ForeignKey("requirements.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

requirement_relations = Table(
    "requirement_relations",
    Base.metadata,
    Column("source_id", Integer, ForeignKey("requirements.id", ondelete="CASCADE"), primary_key=True),
    Column("target_id", Integer, ForeignKey("requirements.id", ondelete="CASCADE"), primary_key=True),
)
