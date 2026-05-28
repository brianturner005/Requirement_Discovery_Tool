from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.requirement import Requirement
from app.models.stakeholder import Stakeholder
from app.schemas.stakeholder import StakeholderCreate, StakeholderResponse, StakeholderUpdate

router = APIRouter(prefix="/stakeholders", tags=["stakeholders"])


@router.get("", response_model=list[StakeholderResponse])
async def list_stakeholders(
    q: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Stakeholder)
    if q:
        stmt = stmt.where(Stakeholder.name.ilike(f"%{q}%"))
    stmt = stmt.order_by(Stakeholder.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=StakeholderResponse, status_code=201)
async def create_stakeholder(data: StakeholderCreate, db: AsyncSession = Depends(get_db)):
    stakeholder = Stakeholder(**data.model_dump())
    db.add(stakeholder)
    await db.flush()
    await db.refresh(stakeholder)
    return stakeholder


@router.get("/{stakeholder_id}", response_model=StakeholderResponse)
async def get_stakeholder(stakeholder_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Stakeholder).where(Stakeholder.id == stakeholder_id))
    stakeholder = result.scalar_one_or_none()
    if not stakeholder:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
    return stakeholder


@router.put("/{stakeholder_id}", response_model=StakeholderResponse)
async def update_stakeholder(stakeholder_id: int, data: StakeholderUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Stakeholder).where(Stakeholder.id == stakeholder_id))
    stakeholder = result.scalar_one_or_none()
    if not stakeholder:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(stakeholder, field, value)
    await db.flush()
    await db.refresh(stakeholder)
    return stakeholder


@router.delete("/{stakeholder_id}", status_code=204)
async def delete_stakeholder(stakeholder_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Stakeholder).where(Stakeholder.id == stakeholder_id))
    stakeholder = result.scalar_one_or_none()
    if not stakeholder:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
    count_result = await db.execute(
        select(func.count(Requirement.id)).where(Requirement.stakeholder_id == stakeholder_id)
    )
    count = count_result.scalar() or 0
    if count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete stakeholder with {count} associated requirement(s). Reassign them first.",
        )
    await db.delete(stakeholder)
