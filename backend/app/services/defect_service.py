from fastapi import HTTPException
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.defect import Defect
from app.schemas.defect import DefectCreate, DefectUpdate


def _load_options():
    return [
        selectinload(Defect.requirement),
        selectinload(Defect.system),
    ]


async def get_defect(db: AsyncSession, defect_id: int) -> Defect:
    result = await db.execute(
        select(Defect).options(*_load_options()).where(Defect.id == defect_id)
    )
    defect = result.scalar_one_or_none()
    if not defect:
        raise HTTPException(status_code=404, detail="Defect not found")
    return defect


async def list_defects(
    db: AsyncSession,
    q: str | None = None,
    status: list[str] | None = None,
    severity: list[str] | None = None,
    requirement_id: int | None = None,
    system_id: list[int] | None = None,
    sort_by: str = "updated_at",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 25,
) -> tuple[list[Defect], int]:
    filters = []
    if q:
        search = f"%{q}%"
        filters.append(or_(Defect.title.ilike(search), Defect.description.ilike(search)))
    if status:
        filters.append(Defect.status.in_(status))
    if severity:
        filters.append(Defect.severity.in_(severity))
    if requirement_id:
        filters.append(Defect.requirement_id == requirement_id)
    if system_id:
        filters.append(Defect.system_id.in_(system_id))

    base_q = select(Defect).options(*_load_options())
    count_q = select(func.count(Defect.id))
    if filters:
        base_q = base_q.where(and_(*filters))
        count_q = count_q.where(and_(*filters))

    total = (await db.execute(count_q)).scalar() or 0
    sort_col = getattr(Defect, sort_by, Defect.updated_at)
    base_q = base_q.order_by(sort_col.asc() if sort_dir == "asc" else sort_col.desc())
    base_q = base_q.offset((page - 1) * page_size).limit(page_size)
    items = list((await db.execute(base_q)).scalars().all())
    return items, total


async def create_defect(db: AsyncSession, data: DefectCreate) -> Defect:
    defect = Defect(
        title=data.title,
        description=data.description,
        severity=data.severity.value,
        status=data.status.value,
        requirement_id=data.requirement_id,
        system_id=data.system_id,
        steps_to_reproduce=data.steps_to_reproduce,
        environment=data.environment,
        resolution_notes=data.resolution_notes,
    )
    db.add(defect)
    await db.flush()
    return await get_defect(db, defect.id)


async def update_defect(db: AsyncSession, defect_id: int, data: DefectUpdate) -> Defect:
    defect = await get_defect(db, defect_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        if hasattr(defect, field):
            setattr(defect, field, value.value if hasattr(value, "value") else value)
    await db.flush()
    return await get_defect(db, defect_id)


async def delete_defect(db: AsyncSession, defect_id: int) -> None:
    defect = await get_defect(db, defect_id)
    await db.delete(defect)
    await db.flush()
