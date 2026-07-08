import math

from fastapi import HTTPException
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.decision import Decision
from app.models.requirement import Requirement
from app.models.tag import Tag
from app.schemas.decision import DecisionCreate, DecisionUpdate


def _load_options():
    return [
        selectinload(Decision.made_by),
        selectinload(Decision.system),
        selectinload(Decision.tags),
        selectinload(Decision.related_requirements),
    ]


async def _get_or_create_tags(db: AsyncSession, tag_names: list[str]) -> list[Tag]:
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


async def _resolve_requirements(db: AsyncSession, ids: list[int]) -> list[Requirement]:
    if not ids:
        return []
    result = await db.execute(select(Requirement).where(Requirement.id.in_(ids)))
    found = result.scalars().all()
    found_ids = {r.id for r in found}
    missing = set(ids) - found_ids
    if missing:
        raise HTTPException(status_code=422, detail=f"Requirement IDs not found: {missing}")
    return list(found)


async def get_decision(db: AsyncSession, decision_id: int) -> Decision:
    result = await db.execute(
        select(Decision).options(*_load_options()).where(Decision.id == decision_id)
    )
    decision = result.scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


async def list_decisions(
    db: AsyncSession,
    q: str | None = None,
    status: list[str] | None = None,
    system_id: list[int] | None = None,
    tag: list[str] | None = None,
    sort_by: str = "updated_at",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 25,
) -> tuple[list[Decision], int]:
    filters = []

    if q:
        search = f"%{q}%"
        filters.append(or_(Decision.title.ilike(search), Decision.description.ilike(search)))
    if status:
        filters.append(Decision.status.in_(status))
    if system_id:
        filters.append(Decision.system_id.in_(system_id))
    if tag:
        from app.models.associations import decision_tags
        tag_subq = (
            select(decision_tags.c.decision_id)
            .join(Tag, Tag.id == decision_tags.c.tag_id)
            .where(Tag.name.in_([t.lower() for t in tag]))
        )
        filters.append(Decision.id.in_(tag_subq))

    base_q = select(Decision).options(*_load_options())
    count_q = select(func.count(Decision.id))
    if filters:
        base_q = base_q.where(and_(*filters))
        count_q = count_q.where(and_(*filters))

    total = (await db.execute(count_q)).scalar() or 0
    sort_col = getattr(Decision, sort_by, Decision.updated_at)
    base_q = base_q.order_by(sort_col.asc() if sort_dir == "asc" else sort_col.desc())
    base_q = base_q.offset((page - 1) * page_size).limit(page_size)
    items = list((await db.execute(base_q)).scalars().all())
    return items, total


async def create_decision(db: AsyncSession, data: DecisionCreate) -> Decision:
    tags = await _get_or_create_tags(db, data.tag_names)
    related = await _resolve_requirements(db, data.related_requirement_ids)

    decision = Decision(
        title=data.title,
        description=data.description,
        rationale=data.rationale,
        status=data.status.value,
        decision_date=data.decision_date,
        alternatives_considered=data.alternatives_considered,
        outcome=data.outcome,
        made_by_id=data.made_by_id,
        system_id=data.system_id,
        tags=tags,
        related_requirements=related,
    )
    db.add(decision)
    await db.flush()
    return await get_decision(db, decision.id)


async def update_decision(db: AsyncSession, decision_id: int, data: DecisionUpdate) -> Decision:
    decision = await get_decision(db, decision_id)
    update_data = data.model_dump(exclude_unset=True)

    if "tag_names" in update_data:
        decision.tags = await _get_or_create_tags(db, update_data.pop("tag_names"))
    else:
        update_data.pop("tag_names", None)

    if "related_requirement_ids" in update_data:
        decision.related_requirements = await _resolve_requirements(
            db, update_data.pop("related_requirement_ids")
        )
    else:
        update_data.pop("related_requirement_ids", None)

    for field, value in update_data.items():
        if hasattr(decision, field):
            setattr(decision, field, value.value if hasattr(value, "value") else value)

    await db.flush()
    return await get_decision(db, decision_id)


async def delete_decision(db: AsyncSession, decision_id: int) -> None:
    decision = await get_decision(db, decision_id)
    await db.delete(decision)
    await db.flush()
