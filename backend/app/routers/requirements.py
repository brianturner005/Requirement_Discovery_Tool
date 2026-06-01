import csv
import io
import math
from datetime import date

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.common import PaginatedResponse, StatusEnum
from app.schemas.requirement import (
    RequirementCreate,
    RequirementResponse,
    RequirementSummary,
    RequirementUpdate,
    StatusTransition,
)
from app.services import requirement_service as svc

router = APIRouter(prefix="/requirements", tags=["requirements"])


def _to_response(req) -> RequirementResponse:
    related = list({r.req_id: r for r in list(req.related_to) + list(req.related_from)}.values())
    return RequirementResponse(
        id=req.id,
        req_id=req.req_id,
        title=req.title,
        description=req.description,
        source=req.source,
        stakeholder=req.stakeholder,
        system=req.system,
        priority=req.priority,
        confidence=req.confidence,
        business_impact=req.business_impact,
        technical_impact=req.technical_impact,
        status=req.status,
        notes=req.notes,
        tags=req.tags,
        related_requirements=[
            RequirementSummary(id=r.id, req_id=r.req_id, title=r.title, status=r.status, priority=r.priority)
            for r in related
        ],
        evidence=req.evidence,
        created_at=req.created_at,
        updated_at=req.updated_at,
    )


@router.get("", response_model=PaginatedResponse[RequirementResponse])
async def list_requirements(
    q: str | None = Query(None, description="Full-text search"),
    status: list[str] | None = Query(None),
    priority: list[str] | None = Query(None),
    source: list[str] | None = Query(None),
    system_id: list[int] | None = Query(None),
    stakeholder_id: list[int] | None = Query(None),
    tag: list[str] | None = Query(None),
    confidence: list[str] | None = Query(None),
    sort_by: str = Query("updated_at"),
    sort_dir: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    items, total = await svc.list_requirements(
        db,
        q=q,
        status=status,
        priority=priority,
        source=source,
        system_id=system_id,
        stakeholder_id=stakeholder_id,
        tag=tag,
        confidence=confidence,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse(
        items=[_to_response(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/export")
async def export_requirements(
    q: str | None = Query(None),
    status: list[str] | None = Query(None),
    priority: list[str] | None = Query(None),
    source: list[str] | None = Query(None),
    system_id: list[int] | None = Query(None),
    stakeholder_id: list[int] | None = Query(None),
    tag: list[str] | None = Query(None),
    confidence: list[str] | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    items, _ = await svc.list_requirements(
        db,
        q=q, status=status, priority=priority, source=source,
        system_id=system_id, stakeholder_id=stakeholder_id,
        tag=tag, confidence=confidence,
        page=1, page_size=10_000,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Title", "Status", "Priority", "Source", "Confidence",
        "Stakeholder", "System", "Tags", "Business Impact",
        "Technical Impact", "Notes", "Created", "Updated",
    ])
    for r in items:
        writer.writerow([
            r.req_id,
            r.title,
            r.status,
            r.priority,
            r.source,
            r.confidence,
            r.stakeholder.name if r.stakeholder else "",
            r.system.name if r.system else "",
            ", ".join(t.name for t in r.tags),
            r.business_impact or "",
            r.technical_impact or "",
            r.notes or "",
            r.created_at.strftime("%Y-%m-%d"),
            r.updated_at.strftime("%Y-%m-%d"),
        ])

    output.seek(0)
    filename = f"requirements-{date.today().isoformat()}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("", response_model=RequirementResponse, status_code=201)
async def create_requirement(data: RequirementCreate, db: AsyncSession = Depends(get_db)):
    req = await svc.create_requirement(db, data)
    return _to_response(req)


@router.get("/{req_id}", response_model=RequirementResponse)
async def get_requirement(req_id: str, db: AsyncSession = Depends(get_db)):
    req = await svc.get_requirement(db, req_id)
    return _to_response(req)


@router.put("/{req_id}", response_model=RequirementResponse)
async def update_requirement(req_id: str, data: RequirementUpdate, db: AsyncSession = Depends(get_db)):
    req = await svc.update_requirement(db, req_id, data)
    return _to_response(req)


@router.patch("/{req_id}/status", response_model=RequirementResponse)
async def transition_status(req_id: str, data: StatusTransition, db: AsyncSession = Depends(get_db)):
    req = await svc.transition_status(db, req_id, data.status)
    return _to_response(req)


@router.delete("/{req_id}", status_code=204)
async def delete_requirement(req_id: str, db: AsyncSession = Depends(get_db)):
    await svc.delete_requirement(db, req_id)


@router.post("/{req_id}/relations/{target_req_id}", response_model=RequirementResponse)
async def add_relation(req_id: str, target_req_id: str, db: AsyncSession = Depends(get_db)):
    req = await svc.add_relation(db, req_id, target_req_id)
    return _to_response(req)


@router.delete("/{req_id}/relations/{target_req_id}", response_model=RequirementResponse)
async def remove_relation(req_id: str, target_req_id: str, db: AsyncSession = Depends(get_db)):
    req = await svc.remove_relation(db, req_id, target_req_id)
    return _to_response(req)
