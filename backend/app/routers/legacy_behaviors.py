import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.legacy_behavior import LegacyBehaviorCreate, LegacyBehaviorResponse, LegacyBehaviorUpdate
from app.services import legacy_behavior_service as svc

router = APIRouter(prefix="/legacy-behaviors", tags=["legacy-behaviors"])


@router.get("", response_model=PaginatedResponse[LegacyBehaviorResponse])
async def list_legacy_behaviors(
    q: str | None = Query(None),
    behavior_type: list[str] | None = Query(None),
    status: list[str] | None = Query(None),
    severity: list[str] | None = Query(None),
    system_id: list[int] | None = Query(None),
    sort_by: str = Query("updated_at"),
    sort_dir: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    items, total = await svc.list_legacy_behaviors(
        db, q=q, behavior_type=behavior_type, status=status, severity=severity, system_id=system_id,
        sort_by=sort_by, sort_dir=sort_dir, page=page, page_size=page_size,
    )
    return PaginatedResponse(
        items=items, total=total, page=page, page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.post("", response_model=LegacyBehaviorResponse, status_code=201)
async def create_legacy_behavior(data: LegacyBehaviorCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_legacy_behavior(db, data)


@router.get("/{behavior_id}", response_model=LegacyBehaviorResponse)
async def get_legacy_behavior(behavior_id: int, db: AsyncSession = Depends(get_db)):
    return await svc.get_legacy_behavior(db, behavior_id)


@router.put("/{behavior_id}", response_model=LegacyBehaviorResponse)
async def update_legacy_behavior(behavior_id: int, data: LegacyBehaviorUpdate, db: AsyncSession = Depends(get_db)):
    return await svc.update_legacy_behavior(db, behavior_id, data)


@router.delete("/{behavior_id}", status_code=204)
async def delete_legacy_behavior(behavior_id: int, db: AsyncSession = Depends(get_db)):
    await svc.delete_legacy_behavior(db, behavior_id)
