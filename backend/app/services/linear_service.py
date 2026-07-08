import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.integration_config import IntegrationConfig

_URL = "https://api.linear.app/graphql"
_KEYS = ["linear_api_key", "linear_team_id"]

_STATUS_MAP = {
    "Todo": "Draft",
    "Backlog": "Draft",
    "Triage": "Draft",
    "In Progress": "In Progress",
    "In Review": "Under Review",
    "Done": "Completed",
    "Cancelled": "Rejected",
    "Duplicate": "Rejected",
}


async def _cfg(db: AsyncSession) -> dict[str, str]:
    result = await db.execute(select(IntegrationConfig).where(IntegrationConfig.key.in_(_KEYS)))
    return {r.key: r.value for r in result.scalars().all() if r.value}


def _headers(api_key: str) -> dict:
    return {"Authorization": api_key, "Content-Type": "application/json"}


async def test_connection(db: AsyncSession) -> dict:
    cfg = await _cfg(db)
    if "linear_api_key" not in cfg:
        return {"connected": False, "error": "Missing Linear API key"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(_URL, json={"query": "{ viewer { id name } }"}, headers=_headers(cfg["linear_api_key"]))
        data = r.json()
        if "errors" in data:
            return {"connected": False, "error": data["errors"][0]["message"]}
        return {"connected": True, "user": data.get("data", {}).get("viewer", {}).get("name")}
    except Exception as exc:
        return {"connected": False, "error": str(exc)}


async def get_teams(db: AsyncSession) -> list[dict]:
    cfg = await _cfg(db)
    if "linear_api_key" not in cfg:
        return []
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(_URL, json={"query": "{ teams { nodes { id name } } }"}, headers=_headers(cfg["linear_api_key"]))
    return r.json().get("data", {}).get("teams", {}).get("nodes", [])


async def push_requirement(db: AsyncSession, req) -> dict:
    cfg = await _cfg(db)
    missing = [k for k in _KEYS if k not in cfg]
    if missing:
        raise ValueError(f"Linear not configured. Missing: {', '.join(missing)}")

    async with httpx.AsyncClient(timeout=15) as client:
        if req.linear_issue_id:
            r = await client.post(
                _URL,
                json={
                    "query": """
                    mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
                      issueUpdate(id: $id, input: $input) {
                        success
                        issue { id identifier url }
                      }
                    }
                    """,
                    "variables": {
                        "id": req.linear_issue_id,
                        "input": {"title": f"[{req.req_id}] {req.title}", "description": req.description or ""},
                    },
                },
                headers=_headers(cfg["linear_api_key"]),
            )
            data = r.json()
            if "errors" in data:
                raise ValueError(data["errors"][0]["message"])
            issue = data["data"]["issueUpdate"]["issue"]
            return {"linear_issue_id": issue["id"], "identifier": issue["identifier"], "url": issue["url"]}
        else:
            r = await client.post(
                _URL,
                json={
                    "query": """
                    mutation IssueCreate($input: IssueCreateInput!) {
                      issueCreate(input: $input) {
                        success
                        issue { id identifier url }
                      }
                    }
                    """,
                    "variables": {
                        "input": {
                            "teamId": cfg["linear_team_id"],
                            "title": f"[{req.req_id}] {req.title}",
                            "description": req.description or "",
                        },
                    },
                },
                headers=_headers(cfg["linear_api_key"]),
            )
            data = r.json()
            if "errors" in data:
                raise ValueError(data["errors"][0]["message"])
            issue = data["data"]["issueCreate"]["issue"]
            req.linear_issue_id = issue["id"]
            return {"linear_issue_id": issue["id"], "identifier": issue["identifier"], "url": issue["url"]}


def map_status(linear_state: str) -> str | None:
    return _STATUS_MAP.get(linear_state)
