from fastapi import HTTPException
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.legacy_behavior import LegacyBehavior
from app.schemas.legacy_behavior import LegacyBehaviorCreate, LegacyBehaviorUpdate


def _load_options():
    return [
        selectinload(LegacyBehavior.system),
        selectinload(LegacyBehavior.related_requirement),
    ]


async def get_legacy_behavior(db: AsyncSession, behavior_id: int) -> LegacyBehavior:
    result = await db.execute(
        select(LegacyBehavior).options(*_load_options()).where(LegacyBehavior.id == behavior_id)
    )
    behavior = result.scalar_one_or_none()
    if not behavior:
        raise HTTPException(status_code=404, detail="Legacy behavior not found")
    return behavior


async def list_legacy_behaviors(
    db: AsyncSession,
    q: str | None = None,
    behavior_type: list[str] | None = None,
    status: list[str] | None = None,
    severity: list[str] | None = None,
    system_id: list[int] | None = None,
    sort_by: str = "updated_at",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 25,
) -> tuple[list[LegacyBehavior], int]:
    filters = []

    if q:
        search = f"%{q}%"
        filters.append(or_(LegacyBehavior.title.ilike(search), LegacyBehavior.description.ilike(search)))
    if behavior_type:
        filters.append(LegacyBehavior.behavior_type.in_(behavior_type))
    if status:
        filters.append(LegacyBehavior.status.in_(status))
    if severity:
        filters.append(LegacyBehavior.severity.in_(severity))
    if system_id:
        filters.append(LegacyBehavior.system_id.in_(system_id))

    base_q = select(LegacyBehavior).options(*_load_options())
    count_q = select(func.count(LegacyBehavior.id))
    if filters:
        base_q = base_q.where(and_(*filters))
        count_q = count_q.where(and_(*filters))

    total = (await db.execute(count_q)).scalar() or 0
    sort_col = getattr(LegacyBehavior, sort_by, LegacyBehavior.updated_at)
    base_q = base_q.order_by(sort_col.asc() if sort_dir == "asc" else sort_col.desc())
    base_q = base_q.offset((page - 1) * page_size).limit(page_size)
    items = list((await db.execute(base_q)).scalars().all())
    return items, total


async def create_legacy_behavior(db: AsyncSession, data: LegacyBehaviorCreate) -> LegacyBehavior:
    behavior = LegacyBehavior(
        title=data.title,
        description=data.description,
        behavior_type=data.behavior_type.value,
        severity=data.severity.value,
        status=data.status.value,
        system_id=data.system_id,
        related_requirement_id=data.related_requirement_id,
        steps_to_reproduce=data.steps_to_reproduce,
        expected_behavior=data.expected_behavior,
        actual_behavior=data.actual_behavior,
    )
    db.add(behavior)
    await db.flush()
    return await get_legacy_behavior(db, behavior.id)


async def update_legacy_behavior(db: AsyncSession, behavior_id: int, data: LegacyBehaviorUpdate) -> LegacyBehavior:
    behavior = await get_legacy_behavior(db, behavior_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        if hasattr(behavior, field):
            setattr(behavior, field, value.value if hasattr(value, "value") else value)
    await db.flush()
    return await get_legacy_behavior(db, behavior_id)


async def delete_legacy_behavior(db: AsyncSession, behavior_id: int) -> None:
    behavior = await get_legacy_behavior(db, behavior_id)
    await db.delete(behavior)
    await db.flush()
