import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.decision import DecisionCreate, DecisionResponse, DecisionUpdate
from app.services import decision_service as svc

router = APIRouter(prefix="/decisions", tags=["decisions"])


@router.get("", response_model=PaginatedResponse[DecisionResponse])
async def list_decisions(
    q: str | None = Query(None),
    status: list[str] | None = Query(None),
    system_id: list[int] | None = Query(None),
    tag: list[str] | None = Query(None),
    sort_by: str = Query("updated_at"),
    sort_dir: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    items, total = await svc.list_decisions(
        db, q=q, status=status, system_id=system_id, tag=tag,
        sort_by=sort_by, sort_dir=sort_dir, page=page, page_size=page_size,
    )
    return PaginatedResponse(
        items=items, total=total, page=page, page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.post("", response_model=DecisionResponse, status_code=201)
async def create_decision(data: DecisionCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_decision(db, data)


@router.get("/{decision_id}", response_model=DecisionResponse)
async def get_decision(decision_id: int, db: AsyncSession = Depends(get_db)):
    return await svc.get_decision(db, decision_id)


@router.put("/{decision_id}", response_model=DecisionResponse)
async def update_decision(decision_id: int, data: DecisionUpdate, db: AsyncSession = Depends(get_db)):
    return await svc.update_decision(db, decision_id, data)


@router.delete("/{decision_id}", status_code=204)
async def delete_decision(decision_id: int, db: AsyncSession = Depends(get_db)):
    await svc.delete_decision(db, decision_id)
