import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.test_case import TestCaseCreate, TestCaseResponse, TestCaseUpdate
from app.services import test_case_service as svc

router = APIRouter(prefix="/test-cases", tags=["test-cases"])


@router.get("", response_model=PaginatedResponse[TestCaseResponse])
async def list_test_cases(
    q: str | None = Query(None),
    status: list[str] | None = Query(None),
    requirement_id: int | None = Query(None),
    sort_by: str = Query("updated_at"),
    sort_dir: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    items, total = await svc.list_test_cases(
        db, q=q, status=status, requirement_id=requirement_id,
        sort_by=sort_by, sort_dir=sort_dir, page=page, page_size=page_size,
    )
    return PaginatedResponse(
        items=items, total=total, page=page, page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.post("", response_model=TestCaseResponse, status_code=201)
async def create_test_case(data: TestCaseCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_test_case(db, data)


@router.get("/{test_case_id}", response_model=TestCaseResponse)
async def get_test_case(test_case_id: int, db: AsyncSession = Depends(get_db)):
    return await svc.get_test_case(db, test_case_id)


@router.put("/{test_case_id}", response_model=TestCaseResponse)
async def update_test_case(test_case_id: int, data: TestCaseUpdate, db: AsyncSession = Depends(get_db)):
    return await svc.update_test_case(db, test_case_id, data)


@router.delete("/{test_case_id}", status_code=204)
async def delete_test_case(test_case_id: int, db: AsyncSession = Depends(get_db)):
    await svc.delete_test_case(db, test_case_id)
