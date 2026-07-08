from fastapi import HTTPException
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.assumption import Assumption
from app.schemas.assumption import AssumptionCreate, AssumptionUpdate


def _load_options():
    return [
        selectinload(Assumption.owner),
        selectinload(Assumption.related_requirement),
    ]


async def get_assumption(db: AsyncSession, assumption_id: int) -> Assumption:
    result = await db.execute(
        select(Assumption).options(*_load_options()).where(Assumption.id == assumption_id)
    )
    assumption = result.scalar_one_or_none()
    if not assumption:
        raise HTTPException(status_code=404, detail="Assumption not found")
    return assumption


async def list_assumptions(
    db: AsyncSession,
    q: str | None = None,
    category: list[str] | None = None,
    status: list[str] | None = None,
    priority: list[str] | None = None,
    owner_id: list[int] | None = None,
    sort_by: str = "updated_at",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 25,
) -> tuple[list[Assumption], int]:
    filters = []

    if q:
        search = f"%{q}%"
        filters.append(or_(Assumption.title.ilike(search), Assumption.description.ilike(search)))
    if category:
        filters.append(Assumption.category.in_(category))
    if status:
        filters.append(Assumption.status.in_(status))
    if priority:
        filters.append(Assumption.priority.in_(priority))
    if owner_id:
        filters.append(Assumption.owner_id.in_(owner_id))

    base_q = select(Assumption).options(*_load_options())
    count_q = select(func.count(Assumption.id))
    if filters:
        base_q = base_q.where(and_(*filters))
        count_q = count_q.where(and_(*filters))

    total = (await db.execute(count_q)).scalar() or 0
    sort_col = getattr(Assumption, sort_by, Assumption.updated_at)
    base_q = base_q.order_by(sort_col.asc() if sort_dir == "asc" else sort_col.desc())
    base_q = base_q.offset((page - 1) * page_size).limit(page_size)
    items = list((await db.execute(base_q)).scalars().all())
    return items, total


async def create_assumption(db: AsyncSession, data: AssumptionCreate) -> Assumption:
    assumption = Assumption(
        title=data.title,
        description=data.description,
        category=data.category.value,
        status=data.status.value,
        priority=data.priority.value,
        owner_id=data.owner_id,
        related_requirement_id=data.related_requirement_id,
        resolution_notes=data.resolution_notes,
    )
    db.add(assumption)
    await db.flush()
    return await get_assumption(db, assumption.id)


async def update_assumption(db: AsyncSession, assumption_id: int, data: AssumptionUpdate) -> Assumption:
    assumption = await get_assumption(db, assumption_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        if hasattr(assumption, field):
            setattr(assumption, field, value.value if hasattr(value, "value") else value)
    await db.flush()
    return await get_assumption(db, assumption_id)


async def delete_assumption(db: AsyncSession, assumption_id: int) -> None:
    assumption = await get_assumption(db, assumption_id)
    await db.delete(assumption)
    await db.flush()
