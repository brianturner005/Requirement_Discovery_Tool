from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

import httpx

from app.config import settings
from app.database import get_db
from app.services.requirement_service import get_requirement, list_requirements

router = APIRouter(prefix="/ai", tags=["ai"])


class AnalysisResponse(BaseModel):
    summary: str
    risks: list[str]
    suggestions: list[str]
    duplicate_candidates: list[str]


async def _call_claude(prompt: str) -> str:
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="AI analysis not configured (ANTHROPIC_API_KEY missing)")
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": prompt}],
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"AI API error: {resp.text}")
        return resp.json()["content"][0]["text"]


@router.post("/analyze/{req_id}", response_model=AnalysisResponse)
async def analyze_requirement(req_id: str, db: AsyncSession = Depends(get_db)):
    req = await get_requirement(db, req_id)

    all_reqs, _ = await list_requirements(db, page=1, page_size=200)
    other_titles = [
        f"{r.req_id}: {r.title}"
        for r in all_reqs
        if r.req_id != req_id
    ]
    others_text = "\n".join(other_titles[:50]) if other_titles else "None"

    prompt = f"""You are a requirements analyst for a legacy system modernization project.

Analyze this requirement and return a JSON object with exactly these keys:
- "summary": a 2-3 sentence plain-English summary
- "risks": list of 2-4 risk strings (implementation risks, ambiguities, dependencies)
- "suggestions": list of 2-3 improvement suggestions for clarity or completeness
- "duplicate_candidates": list of req IDs from the other requirements that may overlap (empty list if none)

Requirement to analyze:
ID: {req.req_id}
Title: {req.title}
Description: {req.description}
Priority: {req.priority}
Source: {req.source}
Status: {req.status}
Business Impact: {req.business_impact or 'Not specified'}
Technical Impact: {req.technical_impact or 'Not specified'}
Notes: {req.notes or 'None'}

Other requirements in the system (for duplicate detection):
{others_text}

Respond ONLY with valid JSON, no markdown, no explanation."""

    raw = await _call_claude(prompt)

    import json
    try:
        data = json.loads(raw)
        return AnalysisResponse(
            summary=data.get("summary", ""),
            risks=data.get("risks", []),
            suggestions=data.get("suggestions", []),
            duplicate_candidates=data.get("duplicate_candidates", []),
        )
    except (json.JSONDecodeError, KeyError):
        return AnalysisResponse(
            summary=raw[:500],
            risks=[],
            suggestions=[],
            duplicate_candidates=[],
        )


@router.post("/flag-risks", response_model=list[dict])
async def flag_risks(db: AsyncSession = Depends(get_db)):
    """Scan all requirements and flag high-risk ones."""
    reqs, _ = await list_requirements(db, page=1, page_size=100)
    if not reqs:
        return []

    req_list = "\n".join(
        f"- {r.req_id}: {r.title} (priority={r.priority}, confidence={r.confidence}, status={r.status})"
        for r in reqs
    )

    prompt = f"""You are a requirements analyst. Review this list of requirements and identify which ones are highest risk.

Requirements:
{req_list}

Return a JSON array of objects with keys:
- "req_id": the requirement ID
- "risk_level": "High", "Medium", or "Low"
- "reason": one sentence explaining the risk

Focus on: vague descriptions, low confidence, missing stakeholder, high priority + draft status.
Respond ONLY with a valid JSON array."""

    raw = await _call_claude(prompt)

    import json
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return []
