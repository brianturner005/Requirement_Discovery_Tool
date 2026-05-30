import pytest

SYSTEM = {"name": "Billing System", "description": "Legacy billing platform", "system_type": "Legacy"}
OTHER = {"name": "Auth Service", "description": "Authentication microservice", "system_type": "Microservice"}

REQ_PAYLOAD = {
    "title": "Requirement linked to system with a long title",
    "description": "Description for requirement linked to a system for delete protection test",
    "source": "SME Interview",
    "priority": "High",
    "confidence": "Medium",
}


@pytest.mark.asyncio
async def test_create_system(client):
    resp = await client.post("/api/v1/systems", json=SYSTEM)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Billing System"
    assert data["system_type"] == "Legacy"


@pytest.mark.asyncio
async def test_list_systems(client):
    await client.post("/api/v1/systems", json=SYSTEM)
    await client.post("/api/v1/systems", json=OTHER)
    resp = await client.get("/api/v1/systems")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_search_systems(client):
    await client.post("/api/v1/systems", json=SYSTEM)
    await client.post("/api/v1/systems", json=OTHER)
    resp = await client.get("/api/v1/systems?q=Billing")
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) == 1
    assert results[0]["name"] == "Billing System"


@pytest.mark.asyncio
async def test_get_system(client):
    create = await client.post("/api/v1/systems", json=SYSTEM)
    sid = create.json()["id"]
    resp = await client.get(f"/api/v1/systems/{sid}")
    assert resp.status_code == 200
    assert resp.json()["id"] == sid


@pytest.mark.asyncio
async def test_get_system_not_found(client):
    resp = await client.get("/api/v1/systems/9999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_system(client):
    create = await client.post("/api/v1/systems", json=SYSTEM)
    sid = create.json()["id"]
    resp = await client.put(f"/api/v1/systems/{sid}", json={"description": "Updated description"})
    assert resp.status_code == 200
    assert resp.json()["description"] == "Updated description"
    assert resp.json()["name"] == "Billing System"


@pytest.mark.asyncio
async def test_delete_system(client):
    create = await client.post("/api/v1/systems", json=SYSTEM)
    sid = create.json()["id"]
    resp = await client.delete(f"/api/v1/systems/{sid}")
    assert resp.status_code == 204
    assert (await client.get(f"/api/v1/systems/{sid}")).status_code == 404


@pytest.mark.asyncio
async def test_delete_system_blocked_by_requirement(client):
    create = await client.post("/api/v1/systems", json=SYSTEM)
    sid = create.json()["id"]
    await client.post("/api/v1/requirements", json={**REQ_PAYLOAD, "system_id": sid})
    resp = await client.delete(f"/api/v1/systems/{sid}")
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_blank_name_rejected(client):
    resp = await client.post("/api/v1/systems", json={**SYSTEM, "name": "   "})
    assert resp.status_code == 422
