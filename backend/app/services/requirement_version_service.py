from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.requirement import Requirement
from app.models.requirement_version import RequirementVersion


def _snapshot(req: Requirement) -> dict:
    return {
        "title": req.title,
        "description": req.description,
        "source": req.source,
        "priority": req.priority,
        "confidence": req.confidence,
        "status": req.status,
        "business_impact": req.business_impact,
        "technical_impact": req.technical_impact,
        "notes": req.notes,
        "stakeholder_id": req.stakeholder_id,
        "system_id": req.system_id,
        "tags": [t.name for t in req.tags],
    }


async def save_version(db: AsyncSession, req: Requirement, changed_by_id: int | None) -> None:
    result = await db.execute(
        select(func.max(RequirementVersion.version_num)).where(
            RequirementVersion.requirement_id == req.id
        )
    )
    max_ver = result.scalar() or 0
    version = RequirementVersion(
        requirement_id=req.id,
        changed_by_id=changed_by_id,
        version_num=max_ver + 1,
        snapshot=_snapshot(req),
    )
    db.add(version)


async def list_versions(db: AsyncSession, req_id: str) -> list[RequirementVersion]:
    from app.models.requirement import Requirement as Req
    req_result = await db.execute(select(Req.id).where(Req.req_id == req_id))
    req_pk = req_result.scalar_one_or_none()
    if req_pk is None:
        return []
    result = await db.execute(
        select(RequirementVersion)
        .options(selectinload(RequirementVersion.changed_by))
        .where(RequirementVersion.requirement_id == req_pk)
        .order_by(RequirementVersion.version_num.desc())
    )
    return list(result.scalars().all())
