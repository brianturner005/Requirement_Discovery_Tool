from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.audit_log import RequirementAuditLog
from app.models.requirement import Requirement
from app.schemas.audit_log import AuditLogResponse

router = APIRouter(tags=["audit-logs"])


@router.get("/requirements/{req_id}/audit-log", response_model=list[AuditLogResponse])
async def list_audit_log(req_id: str, db: AsyncSession = Depends(get_db)):
    req_result = await db.execute(select(Requirement).where(Requirement.req_id == req_id))
    req = req_result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")

    result = await db.execute(
        select(RequirementAuditLog)
        .options(selectinload(RequirementAuditLog.changed_by))
        .where(RequirementAuditLog.requirement_id == req.id)
        .order_by(RequirementAuditLog.changed_at.desc())
    )
    return result.scalars().all()
