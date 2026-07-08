from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.system_dependency import SystemDependency
from app.schemas.system_dependency import SystemDependencyCreate, SystemDependencyUpdate


def _load_options():
    return [
        selectinload(SystemDependency.source_system),
        selectinload(SystemDependency.target_system),
    ]


async def list_dependencies(
    db: AsyncSession,
    system_id: int | None = None,
) -> list[SystemDependency]:
    q = select(SystemDependency).options(*_load_options())
    if system_id is not None:
        q = q.where(
            or_(
                SystemDependency.source_system_id == system_id,
                SystemDependency.target_system_id == system_id,
            )
        )
    result = await db.execute(q.order_by(SystemDependency.created_at.desc()))
    return list(result.scalars().all())


async def get_dependency(db: AsyncSession, dep_id: int) -> SystemDependency:
    result = await db.execute(
        select(SystemDependency).options(*_load_options()).where(SystemDependency.id == dep_id)
    )
    dep = result.scalar_one_or_none()
    if not dep:
        raise HTTPException(status_code=404, detail="Dependency not found")
    return dep


async def create_dependency(db: AsyncSession, data: SystemDependencyCreate) -> SystemDependency:
    if data.source_system_id == data.target_system_id:
        raise HTTPException(status_code=422, detail="A system cannot depend on itself")
    dep = SystemDependency(
        source_system_id=data.source_system_id,
        target_system_id=data.target_system_id,
        dependency_type=data.dependency_type.value,
        notes=data.notes,
    )
    db.add(dep)
    await db.flush()
    return await get_dependency(db, dep.id)


async def update_dependency(db: AsyncSession, dep_id: int, data: SystemDependencyUpdate) -> SystemDependency:
    dep = await get_dependency(db, dep_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        if hasattr(dep, field):
            setattr(dep, field, value.value if hasattr(value, "value") else value)
    await db.flush()
    return await get_dependency(db, dep_id)


async def delete_dependency(db: AsyncSession, dep_id: int) -> None:
    dep = await get_dependency(db, dep_id)
    await db.delete(dep)
    await db.flush()
