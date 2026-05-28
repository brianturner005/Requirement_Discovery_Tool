from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.associations import requirement_tags
from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagResponse

router = APIRouter(prefix="/tags", tags=["tags"])


class TagWithCount(TagResponse):
    usage_count: int


@router.get("", response_model=list[TagWithCount])
async def list_tags(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Tag, func.count(requirement_tags.c.requirement_id).label("usage_count"))
        .outerjoin(requirement_tags, Tag.id == requirement_tags.c.tag_id)
        .group_by(Tag.id)
        .order_by(Tag.name)
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [TagWithCount(id=row.Tag.id, name=row.Tag.name, usage_count=row.usage_count) for row in rows]


@router.post("", response_model=TagResponse, status_code=201)
async def create_tag(data: TagCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Tag).where(Tag.name == data.name))
    tag = existing.scalar_one_or_none()
    if tag:
        return tag
    tag = Tag(name=data.name)
    db.add(tag)
    await db.flush()
    await db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=204)
async def delete_tag(tag_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    await db.delete(tag)
