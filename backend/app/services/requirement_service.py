from fastapi import HTTPException
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.requirement import Requirement
from app.models.tag import Tag
from app.schemas.common import VALID_TRANSITIONS, StatusEnum
from app.schemas.requirement import RequirementCreate, RequirementUpdate


async def generate_req_id(db: AsyncSession) -> str:
    result = await db.execute(select(func.max(Requirement.id)))
    max_id = result.scalar()
    next_num = (max_id or 0) + 1
    return f"REQ-{next_num:03d}"


def _load_options():
    return [
        selectinload(Requirement.stakeholder),
        selectinload(Requirement.system),
        selectinload(Requirement.tags),
        selectinload(Requirement.evidence),
        selectinload(Requirement.related_to),
        selectinload(Requirement.related_from),
    ]


async def get_or_create_tags(db: AsyncSession, tag_names: list[str]) -> list[Tag]:
    tags = []
    for name in tag_names:
        name = name.strip().lower()
        if not name:
            continue
        result = await db.execute(select(Tag).where(Tag.name == name))
        tag = result.scalar_one_or_none()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            await db.flush()
        tags.append(tag)
    return tags


async def resolve_related_requirements(db: AsyncSession, req_ids: list[str]) -> list[Requirement]:
    if not req_ids:
        return []
    result = await db.execute(select(Requirement).where(Requirement.req_id.in_(req_ids)))
    found = result.scalars().all()
    found_ids = {r.req_id for r in found}
    missing = set(req_ids) - found_ids
    if missing:
        raise HTTPException(status_code=422, detail=f"Requirement IDs not found: {', '.join(missing)}")
    return list(found)


async def create_requirement(db: AsyncSession, data: RequirementCreate) -> Requirement:
    req_id = await generate_req_id(db)
    tags = await get_or_create_tags(db, data.tag_names)
    related = await resolve_related_requirements(db, data.related_req_ids)

    req = Requirement(
        req_id=req_id,
        title=data.title,
        description=data.description,
        source=data.source.value,
        stakeholder_id=data.stakeholder_id,
        system_id=data.system_id,
        priority=data.priority.value,
        confidence=data.confidence.value,
        business_impact=data.business_impact,
        technical_impact=data.technical_impact,
        notes=data.notes,
        status=StatusEnum.DRAFT.value,
        tags=tags,
        related_to=related,
    )
    db.add(req)
    await db.flush()
    new_req_id = req.req_id
    return await get_requirement(db, new_req_id)


async def get_requirement(db: AsyncSession, req_id: str) -> Requirement:
    result = await db.execute(
        select(Requirement).options(*_load_options()).where(Requirement.req_id == req_id)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail=f"Requirement {req_id} not found")
    return req


async def get_requirement_by_id(db: AsyncSession, req_pk: int) -> Requirement:
    result = await db.execute(
        select(Requirement).options(*_load_options()).where(Requirement.id == req_pk)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")
    return req


async def list_requirements(
    db: AsyncSession,
    q: str | None = None,
    status: list[str] | None = None,
    priority: list[str] | None = None,
    source: list[str] | None = None,
    system_id: list[int] | None = None,
    stakeholder_id: list[int] | None = None,
    tag: list[str] | None = None,
    confidence: list[str] | None = None,
    sort_by: str = "updated_at",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 25,
) -> tuple[list[Requirement], int]:
    filters = []

    if q:
        search_term = f"%{q}%"
        filters.append(
            or_(
                Requirement.title.ilike(search_term),
                Requirement.description.ilike(search_term),
                Requirement.req_id.ilike(search_term),
            )
        )
    if status:
        filters.append(Requirement.status.in_(status))
    if priority:
        filters.append(Requirement.priority.in_(priority))
    if source:
        filters.append(Requirement.source.in_(source))
    if system_id:
        filters.append(Requirement.system_id.in_(system_id))
    if stakeholder_id:
        filters.append(Requirement.stakeholder_id.in_(stakeholder_id))
    if confidence:
        filters.append(Requirement.confidence.in_(confidence))
    if tag:
        from app.models.associations import requirement_tags

        tag_subq = (
            select(requirement_tags.c.requirement_id)
            .join(Tag, Tag.id == requirement_tags.c.tag_id)
            .where(Tag.name.in_([t.lower() for t in tag]))
        )
        filters.append(Requirement.id.in_(tag_subq))

    base_query = select(Requirement).options(*_load_options())
    if filters:
        base_query = base_query.where(and_(*filters))

    count_query = select(func.count(Requirement.id))
    if filters:
        count_query = count_query.where(and_(*filters))
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    sort_col = getattr(Requirement, sort_by, Requirement.updated_at)
    if sort_dir == "asc":
        base_query = base_query.order_by(sort_col.asc())
    else:
        base_query = base_query.order_by(sort_col.desc())

    offset = (page - 1) * page_size
    base_query = base_query.offset(offset).limit(page_size)

    result = await db.execute(base_query)
    items = list(result.scalars().all())
    return items, total


async def update_requirement(db: AsyncSession, req_id: str, data: RequirementUpdate) -> Requirement:
    req = await get_requirement(db, req_id)
    update_data = data.model_dump(exclude_unset=True)

    if "tag_names" in update_data:
        req.tags = await get_or_create_tags(db, update_data.pop("tag_names"))
    else:
        update_data.pop("tag_names", None)

    if "related_req_ids" in update_data:
        related = await resolve_related_requirements(db, update_data.pop("related_req_ids"))
        req.related_to = related
    else:
        update_data.pop("related_req_ids", None)

    if "status" in update_data:
        new_status = StatusEnum(update_data["status"])
        current_status = StatusEnum(req.status)
        allowed = VALID_TRANSITIONS.get(current_status, [])
        if new_status not in allowed:
            raise HTTPException(
                status_code=422,
                detail=f"Cannot transition from '{current_status.value}' to '{new_status.value}'. "
                f"Allowed: {[s.value for s in allowed]}",
            )

    for field, value in update_data.items():
        if hasattr(req, field):
            if hasattr(value, "value"):
                setattr(req, field, value.value)
            else:
                setattr(req, field, value)

    await db.flush()
    return await get_requirement(db, req_id)


async def transition_status(db: AsyncSession, req_id: str, new_status: StatusEnum) -> Requirement:
    req = await get_requirement(db, req_id)
    current_status = StatusEnum(req.status)
    allowed = VALID_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=422,
            detail=f"Cannot transition from '{current_status.value}' to '{new_status.value}'. "
            f"Allowed: {[s.value for s in allowed]}",
        )
    req.status = new_status.value
    await db.flush()
    return await get_requirement(db, req_id)


async def delete_requirement(db: AsyncSession, req_id: str) -> None:
    req = await get_requirement(db, req_id)
    await db.delete(req)
    await db.flush()


async def add_relation(db: AsyncSession, req_id: str, target_req_id: str) -> Requirement:
    if req_id == target_req_id:
        raise HTTPException(status_code=422, detail="Cannot relate a requirement to itself")
    req = await get_requirement(db, req_id)
    target = await get_requirement(db, target_req_id)
    if target not in req.related_to:
        req.related_to.append(target)
        await db.flush()
    return await get_requirement(db, req_id)


async def remove_relation(db: AsyncSession, req_id: str, target_req_id: str) -> Requirement:
    req = await get_requirement(db, req_id)
    target = await get_requirement(db, target_req_id)
    if target in req.related_to:
        req.related_to.remove(target)
        await db.flush()
    return await get_requirement(db, req_id)
