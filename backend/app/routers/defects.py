import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.defect import DefectCreate, DefectResponse, DefectUpdate
from app.services import defect_service as svc

router = APIRouter(prefix="/defects", tags=["defects"])


@router.get("", response_model=PaginatedResponse[DefectResponse])
async def list_defects(
    q: str | None = Query(None),
    status: list[str] | None = Query(None),
    severity: list[str] | None = Query(None),
    requirement_id: int | None = Query(None),
    system_id: list[int] | None = Query(None),
    sort_by: str = Query("updated_at"),
    sort_dir: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    items, total = await svc.list_defects(
        db, q=q, status=status, severity=severity, requirement_id=requirement_id,
        system_id=system_id, sort_by=sort_by, sort_dir=sort_dir, page=page, page_size=page_size,
    )
    return PaginatedResponse(
        items=items, total=total, page=page, page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.post("", response_model=DefectResponse, status_code=201)
async def create_defect(data: DefectCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_defect(db, data)


@router.get("/{defect_id}", response_model=DefectResponse)
async def get_defect(defect_id: int, db: AsyncSession = Depends(get_db)):
    return await svc.get_defect(db, defect_id)


@router.put("/{defect_id}", response_model=DefectResponse)
async def update_defect(defect_id: int, data: DefectUpdate, db: AsyncSession = Depends(get_db)):
    return await svc.update_defect(db, defect_id, data)


@router.delete("/{defect_id}", status_code=204)
async def delete_defect(defect_id: int, db: AsyncSession = Depends(get_db)):
    await svc.delete_defect(db, defect_id)
