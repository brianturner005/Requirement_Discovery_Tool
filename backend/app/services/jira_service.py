import base64

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.integration_config import IntegrationConfig

_KEYS = ["jira_domain", "jira_email", "jira_api_token", "jira_project_key", "jira_issue_type"]

_STATUS_MAP = {
    "To Do": "Draft",
    "Open": "Draft",
    "Backlog": "Draft",
    "In Progress": "In Progress",
    "In Review": "Under Review",
    "Review": "Under Review",
    "Done": "Completed",
    "Closed": "Completed",
    "Resolved": "Completed",
    "Cancelled": "Rejected",
    "Won't Do": "Rejected",
}


async def _cfg(db: AsyncSession) -> dict[str, str]:
    result = await db.execute(select(IntegrationConfig).where(IntegrationConfig.key.in_(_KEYS)))
    return {r.key: r.value for r in result.scalars().all() if r.value}


def _auth(email: str, token: str) -> str:
    return "Basic " + base64.b64encode(f"{email}:{token}".encode()).decode()


def _adf(text: str) -> dict:
    return {
        "type": "doc",
        "version": 1,
        "content": [{"type": "paragraph", "content": [{"type": "text", "text": text or " "}]}],
    }


async def test_connection(db: AsyncSession) -> dict:
    cfg = await _cfg(db)
    missing = [k for k in ["jira_domain", "jira_email", "jira_api_token"] if k not in cfg]
    if missing:
        return {"connected": False, "error": f"Missing config: {', '.join(missing)}"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"https://{cfg['jira_domain']}.atlassian.net/rest/api/3/myself",
                headers={"Authorization": _auth(cfg["jira_email"], cfg["jira_api_token"]), "Accept": "application/json"},
            )
        if r.status_code == 200:
            return {"connected": True, "user": r.json().get("displayName")}
        return {"connected": False, "error": f"HTTP {r.status_code}"}
    except Exception as exc:
        return {"connected": False, "error": str(exc)}


async def push_requirement(db: AsyncSession, req) -> dict:
    cfg = await _cfg(db)
    missing = [k for k in ["jira_domain", "jira_email", "jira_api_token", "jira_project_key"] if k not in cfg]
    if missing:
        raise ValueError(f"Jira not configured. Missing: {', '.join(missing)}")

    base_url = f"https://{cfg['jira_domain']}.atlassian.net"
    headers = {
        "Authorization": _auth(cfg["jira_email"], cfg["jira_api_token"]),
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        if req.jira_issue_key:
            r = await client.put(
                f"{base_url}/rest/api/3/issue/{req.jira_issue_key}",
                json={"fields": {
                    "summary": f"[{req.req_id}] {req.title}",
                    "description": _adf(req.description or ""),
                }},
                headers=headers,
            )
            if r.status_code not in (200, 204):
                raise ValueError(f"Jira update failed: {r.text[:200]}")
            return {"jira_issue_key": req.jira_issue_key, "url": f"{base_url}/browse/{req.jira_issue_key}", "updated": True}
        else:
            r = await client.post(
                f"{base_url}/rest/api/3/issue",
                json={"fields": {
                    "project": {"key": cfg["jira_project_key"]},
                    "summary": f"[{req.req_id}] {req.title}",
                    "description": _adf(req.description or ""),
                    "issuetype": {"name": cfg.get("jira_issue_type", "Story")},
                }},
                headers=headers,
            )
            if r.status_code not in (200, 201):
                raise ValueError(f"Jira create failed: {r.text[:200]}")
            key = r.json()["key"]
            req.jira_issue_key = key
            return {"jira_issue_key": key, "url": f"{base_url}/browse/{key}"}


def map_status(jira_status: str) -> str | None:
    return _STATUS_MAP.get(jira_status)
