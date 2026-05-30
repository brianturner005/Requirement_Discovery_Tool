import pytest

REQ_PAYLOAD = {
    "title": "Dashboard test requirement with a long enough title",
    "description": "Requirement used to verify dashboard statistics and aggregations",
    "source": "SME Interview",
    "priority": "High",
    "confidence": "Medium",
}


@pytest.mark.asyncio
async def test_dashboard_empty_state(client):
    resp = await client.get("/api/v1/dashboard/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_requirements"] == 0
    assert data["by_status"] == {}
    assert data["by_priority"] == {}
    assert data["approval_rate"] == 0.0
    assert data["recent_requirements"] == []


@pytest.mark.asyncio
async def test_dashboard_total_and_status_counts(client):
    await client.post("/api/v1/requirements", json=REQ_PAYLOAD)
    await client.post("/api/v1/requirements", json={**REQ_PAYLOAD, "title": "Second dashboard requirement long title"})

    resp = await client.get("/api/v1/dashboard/stats")
    data = resp.json()
    assert data["total_requirements"] == 2
    assert data["by_status"]["Draft"] == 2


@pytest.mark.asyncio
async def test_dashboard_priority_counts(client):
    await client.post("/api/v1/requirements", json={**REQ_PAYLOAD, "priority": "High"})
    await client.post("/api/v1/requirements", json={**REQ_PAYLOAD, "title": "Low priority requirement long title", "priority": "Low"})

    resp = await client.get("/api/v1/dashboard/stats")
    data = resp.json()
    assert data["by_priority"]["High"] == 1
    assert data["by_priority"]["Low"] == 1


@pytest.mark.asyncio
async def test_dashboard_approval_rate(client):
    r1 = (await client.post("/api/v1/requirements", json=REQ_PAYLOAD)).json()
    await client.post("/api/v1/requirements", json={**REQ_PAYLOAD, "title": "Second requirement for approval rate test"})

    await client.patch(f"/api/v1/requirements/{r1['req_id']}/status", json={"status": "Under Review"})
    await client.patch(f"/api/v1/requirements/{r1['req_id']}/status", json={"status": "Approved"})

    resp = await client.get("/api/v1/dashboard/stats")
    assert resp.json()["approval_rate"] == 0.5


@pytest.mark.asyncio
async def test_dashboard_recent_requirements_capped_at_five(client):
    for i in range(7):
        await client.post("/api/v1/requirements", json={**REQ_PAYLOAD, "title": f"Requirement number {i} long title here"})

    resp = await client.get("/api/v1/dashboard/stats")
    assert len(resp.json()["recent_requirements"]) == 5


@pytest.mark.asyncio
async def test_dashboard_by_system(client):
    system = (await client.post("/api/v1/systems", json={"name": "Billing System", "system_type": "Legacy"})).json()
    await client.post("/api/v1/requirements", json={**REQ_PAYLOAD, "system_id": system["id"]})
    await client.post("/api/v1/requirements", json={**REQ_PAYLOAD, "title": "Second system requirement long title", "system_id": system["id"]})

    resp = await client.get("/api/v1/dashboard/stats")
    by_system = resp.json()["by_system"]
    assert any(s["system"] == "Billing System" and s["count"] == 2 for s in by_system)
