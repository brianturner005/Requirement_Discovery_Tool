from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_admin
from app.database import get_db
from app.models.integration_config import IntegrationConfig
from app.models.user import User
from app.services import jira_service, linear_service

router = APIRouter(prefix="/integrations", tags=["integrations"])
webhook_router = APIRouter(prefix="/integrations", tags=["webhooks"])


class JiraConfig(BaseModel):
    domain: str
    email: str
    api_token: str
    project_key: str
    issue_type: str = "Story"


class LinearConfig(BaseModel):
    api_key: str
    team_id: str


async def _upsert(db: AsyncSession, key: str, value: str) -> None:
    result = await db.execute(select(IntegrationConfig).where(IntegrationConfig.key == key))
    row = result.scalar_one_or_none()
    if row:
        row.value = value
    else:
        db.add(IntegrationConfig(key=key, value=value))


# ── Status ────────────────────────────────────────────────────────────────────

@router.get("/status")
async def get_status(db: AsyncSession = Depends(get_db)):
    return {
        "jira": await jira_service.test_connection(db),
        "linear": await linear_service.test_connection(db),
    }


# ── Jira config ───────────────────────────────────────────────────────────────

@router.post("/jira/configure")
async def configure_jira(
    body: JiraConfig,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    for key, val in [
        ("jira_domain", body.domain),
        ("jira_email", body.email),
        ("jira_api_token", body.api_token),
        ("jira_project_key", body.project_key),
        ("jira_issue_type", body.issue_type),
    ]:
        await _upsert(db, key, val)
    return await jira_service.test_connection(db)


@router.post("/jira/test")
async def test_jira(db: AsyncSession = Depends(get_db)):
    return await jira_service.test_connection(db)


# ── Linear config ─────────────────────────────────────────────────────────────

@router.post("/linear/configure")
async def configure_linear(
    body: LinearConfig,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    await _upsert(db, "linear_api_key", body.api_key)
    await _upsert(db, "linear_team_id", body.team_id)
    return await linear_service.test_connection(db)


@router.post("/linear/test")
async def test_linear(db: AsyncSession = Depends(get_db)):
    return await linear_service.test_connection(db)


@router.get("/linear/teams")
async def list_linear_teams(db: AsyncSession = Depends(get_db)):
    return await linear_service.get_teams(db)


# ── Webhooks (no auth — registered separately in main.py) ────────────────────

@webhook_router.post("/jira/webhook")
async def jira_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    from app.models.requirement import Requirement
    try:
        payload = await request.json()
    except Exception:
        return {"ok": True}
    issue_key = payload.get("issue", {}).get("key")
    status_name = payload.get("issue", {}).get("fields", {}).get("status", {}).get("name")
    if issue_key and status_name:
        result = await db.execute(select(Requirement).where(Requirement.jira_issue_key == issue_key))
        req = result.scalar_one_or_none()
        if req:
            mapped = jira_service.map_status(status_name)
            if mapped and mapped != req.status:
                req.status = mapped
    return {"ok": True}


@webhook_router.post("/linear/webhook")
async def linear_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    from app.models.requirement import Requirement
    try:
        payload = await request.json()
    except Exception:
        return {"ok": True}
    if payload.get("type") != "Issue":
        return {"ok": True}
    data = payload.get("data", {})
    issue_id = data.get("id")
    state_name = data.get("state", {}).get("name")
    if issue_id and state_name:
        result = await db.execute(select(Requirement).where(Requirement.linear_issue_id == issue_id))
        req = result.scalar_one_or_none()
        if req:
            mapped = linear_service.map_status(state_name)
            if mapped and mapped != req.status:
                req.status = mapped
    return {"ok": True}
