from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.requirement import Requirement
from app.models.system import System

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    total_result = await db.execute(select(func.count(Requirement.id)))
    total = total_result.scalar() or 0

    status_result = await db.execute(
        select(Requirement.status, func.count(Requirement.id).label("count"))
        .group_by(Requirement.status)
    )
    by_status = {row.status: row.count for row in status_result}

    priority_result = await db.execute(
        select(Requirement.priority, func.count(Requirement.id).label("count"))
        .group_by(Requirement.priority)
    )
    by_priority = {row.priority: row.count for row in priority_result}

    source_result = await db.execute(
        select(Requirement.source, func.count(Requirement.id).label("count"))
        .group_by(Requirement.source)
    )
    by_source = {row.source: row.count for row in source_result}

    system_result = await db.execute(
        select(System.name, func.count(Requirement.id).label("count"))
        .join(Requirement, Requirement.system_id == System.id)
        .group_by(System.name)
        .order_by(func.count(Requirement.id).desc())
        .limit(10)
    )
    by_system = [{"system": row.name, "count": row.count} for row in system_result]

    recent_result = await db.execute(
        select(Requirement)
        .order_by(Requirement.updated_at.desc())
        .limit(5)
    )
    recent = recent_result.scalars().all()

    approved = by_status.get("Approved", 0)
    approval_rate = round(approved / total, 2) if total > 0 else 0.0

    return {
        "total_requirements": total,
        "by_status": by_status,
        "by_priority": by_priority,
        "by_source": by_source,
        "by_system": by_system,
        "recent_requirements": [
            {
                "id": r.id,
                "req_id": r.req_id,
                "title": r.title,
                "status": r.status,
                "priority": r.priority,
                "updated_at": r.updated_at.isoformat(),
            }
            for r in recent
        ],
        "approval_rate": approval_rate,
    }
