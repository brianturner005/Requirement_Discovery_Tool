import pytest

STAKEHOLDER = {"name": "Alice Smith", "email": "alice@example.com", "role": "BA", "department": "IT"}
OTHER = {"name": "Bob Jones", "email": "bob@example.com", "role": "PM", "department": "Ops"}

REQ_PAYLOAD = {
    "title": "Requirement linked to stakeholder long title",
    "description": "Description for requirement linked to a stakeholder for delete test",
    "source": "SME Interview",
    "priority": "High",
    "confidence": "Medium",
}


@pytest.mark.asyncio
async def test_create_stakeholder(client):
    resp = await client.post("/api/v1/stakeholders", json=STAKEHOLDER)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Alice Smith"
    assert data["email"] == "alice@example.com"
    assert data["role"] == "BA"
    assert data["department"] == "IT"


@pytest.mark.asyncio
async def test_list_stakeholders(client):
    await client.post("/api/v1/stakeholders", json=STAKEHOLDER)
    await client.post("/api/v1/stakeholders", json=OTHER)
    resp = await client.get("/api/v1/stakeholders")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_search_stakeholders(client):
    await client.post("/api/v1/stakeholders", json=STAKEHOLDER)
    await client.post("/api/v1/stakeholders", json=OTHER)
    resp = await client.get("/api/v1/stakeholders?q=Alice")
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) == 1
    assert results[0]["name"] == "Alice Smith"


@pytest.mark.asyncio
async def test_get_stakeholder(client):
    create = await client.post("/api/v1/stakeholders", json=STAKEHOLDER)
    sid = create.json()["id"]
    resp = await client.get(f"/api/v1/stakeholders/{sid}")
    assert resp.status_code == 200
    assert resp.json()["id"] == sid


@pytest.mark.asyncio
async def test_get_stakeholder_not_found(client):
    resp = await client.get("/api/v1/stakeholders/9999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_stakeholder(client):
    create = await client.post("/api/v1/stakeholders", json=STAKEHOLDER)
    sid = create.json()["id"]
    resp = await client.put(f"/api/v1/stakeholders/{sid}", json={"role": "CTO"})
    assert resp.status_code == 200
    assert resp.json()["role"] == "CTO"
    assert resp.json()["name"] == "Alice Smith"


@pytest.mark.asyncio
async def test_delete_stakeholder(client):
    create = await client.post("/api/v1/stakeholders", json=STAKEHOLDER)
    sid = create.json()["id"]
    resp = await client.delete(f"/api/v1/stakeholders/{sid}")
    assert resp.status_code == 204
    assert (await client.get(f"/api/v1/stakeholders/{sid}")).status_code == 404


@pytest.mark.asyncio
async def test_delete_stakeholder_blocked_by_requirement(client):
    create = await client.post("/api/v1/stakeholders", json=STAKEHOLDER)
    sid = create.json()["id"]
    await client.post("/api/v1/requirements", json={**REQ_PAYLOAD, "stakeholder_id": sid})
    resp = await client.delete(f"/api/v1/stakeholders/{sid}")
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_invalid_email_rejected(client):
    resp = await client.post("/api/v1/stakeholders", json={**STAKEHOLDER, "email": "not-an-email"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_blank_name_rejected(client):
    resp = await client.post("/api/v1/stakeholders", json={**STAKEHOLDER, "name": "   "})
    assert resp.status_code == 422
