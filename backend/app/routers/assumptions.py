import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.assumption import AssumptionCreate, AssumptionResponse, AssumptionUpdate
from app.services import assumption_service as svc

router = APIRouter(prefix="/assumptions", tags=["assumptions"])


@router.get("", response_model=PaginatedResponse[AssumptionResponse])
async def list_assumptions(
    q: str | None = Query(None),
    category: list[str] | None = Query(None),
    status: list[str] | None = Query(None),
    priority: list[str] | None = Query(None),
    owner_id: list[int] | None = Query(None),
    sort_by: str = Query("updated_at"),
    sort_dir: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    items, total = await svc.list_assumptions(
        db, q=q, category=category, status=status, priority=priority, owner_id=owner_id,
        sort_by=sort_by, sort_dir=sort_dir, page=page, page_size=page_size,
    )
    return PaginatedResponse(
        items=items, total=total, page=page, page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.post("", response_model=AssumptionResponse, status_code=201)
async def create_assumption(data: AssumptionCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_assumption(db, data)


@router.get("/{assumption_id}", response_model=AssumptionResponse)
async def get_assumption(assumption_id: int, db: AsyncSession = Depends(get_db)):
    return await svc.get_assumption(db, assumption_id)


@router.put("/{assumption_id}", response_model=AssumptionResponse)
async def update_assumption(assumption_id: int, data: AssumptionUpdate, db: AsyncSession = Depends(get_db)):
    return await svc.update_assumption(db, assumption_id, data)


@router.delete("/{assumption_id}", status_code=204)
async def delete_assumption(assumption_id: int, db: AsyncSession = Depends(get_db)):
    await svc.delete_assumption(db, assumption_id)
