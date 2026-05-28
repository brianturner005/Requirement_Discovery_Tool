from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.requirement import Requirement
from app.models.system import System
from app.schemas.system import SystemCreate, SystemResponse, SystemUpdate

router = APIRouter(prefix="/systems", tags=["systems"])


@router.get("", response_model=list[SystemResponse])
async def list_systems(
    q: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(System)
    if q:
        stmt = stmt.where(System.name.ilike(f"%{q}%"))
    stmt = stmt.order_by(System.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=SystemResponse, status_code=201)
async def create_system(data: SystemCreate, db: AsyncSession = Depends(get_db)):
    system = System(**data.model_dump())
    db.add(system)
    await db.flush()
    await db.refresh(system)
    return system


@router.get("/{system_id}", response_model=SystemResponse)
async def get_system(system_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(System).where(System.id == system_id))
    system = result.scalar_one_or_none()
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    return system


@router.put("/{system_id}", response_model=SystemResponse)
async def update_system(system_id: int, data: SystemUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(System).where(System.id == system_id))
    system = result.scalar_one_or_none()
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(system, field, value)
    await db.flush()
    await db.refresh(system)
    return system


@router.delete("/{system_id}", status_code=204)
async def delete_system(system_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(System).where(System.id == system_id))
    system = result.scalar_one_or_none()
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    count_result = await db.execute(
        select(func.count(Requirement.id)).where(Requirement.system_id == system_id)
    )
    count = count_result.scalar() or 0
    if count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete system with {count} associated requirement(s). Reassign them first.",
        )
    await db.delete(system)
