from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.evidence import Evidence
from app.models.requirement import Requirement
from app.schemas.evidence import EvidenceResponse
from app.services import evidence_service as ev_svc

router = APIRouter(tags=["evidence"])

MAX_FILES_PER_REQUIREMENT = 20


@router.get("/requirements/{req_id}/evidence", response_model=list[EvidenceResponse])
async def list_evidence(req_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Requirement).where(Requirement.req_id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")
    ev_result = await db.execute(select(Evidence).where(Evidence.requirement_id == req.id))
    return ev_result.scalars().all()


@router.post("/requirements/{req_id}/evidence", response_model=EvidenceResponse, status_code=201)
async def upload_evidence(req_id: str, file: UploadFile, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Requirement).where(Requirement.req_id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")

    count_result = await db.execute(select(Evidence).where(Evidence.requirement_id == req.id))
    existing = count_result.scalars().all()
    if len(existing) >= MAX_FILES_PER_REQUIREMENT:
        raise HTTPException(status_code=422, detail=f"Maximum {MAX_FILES_PER_REQUIREMENT} evidence files per requirement")

    file_data = await ev_svc.save_upload(req.id, file)
    evidence = Evidence(requirement_id=req.id, **file_data)
    db.add(evidence)
    await db.flush()
    await db.refresh(evidence)
    return evidence


@router.get("/evidence/{evidence_id}/download")
async def download_evidence(evidence_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Evidence).where(Evidence.id == evidence_id))
    evidence = result.scalar_one_or_none()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    file_path = ev_svc.get_file_path(evidence.requirement_id, evidence.stored_filename)
    return FileResponse(
        path=str(file_path),
        filename=evidence.filename,
        media_type=evidence.content_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{evidence.filename}"'},
    )


@router.delete("/evidence/{evidence_id}", status_code=204)
async def delete_evidence(evidence_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Evidence).where(Evidence.id == evidence_id))
    evidence = result.scalar_one_or_none()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    await ev_svc.delete_file(evidence.requirement_id, evidence.stored_filename)
    await db.delete(evidence)
