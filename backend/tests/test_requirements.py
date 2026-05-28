import pytest


REQ_PAYLOAD = {
    "title": "User login must be secure",
    "description": "The system must authenticate users using secure methods to prevent unauthorized access.",
    "source": "SME Interview",
    "priority": "High",
    "confidence": "Medium",
}


@pytest.mark.asyncio
async def test_create_requirement(client):
    resp = await client.post("/api/v1/requirements", json=REQ_PAYLOAD)
    assert resp.status_code == 201
    data = resp.json()
    assert data["req_id"] == "REQ-001"
    assert data["title"] == REQ_PAYLOAD["title"]
    assert data["status"] == "Draft"


@pytest.mark.asyncio
async def test_sequential_req_ids(client):
    for i in range(3):
        resp = await client.post("/api/v1/requirements", json={**REQ_PAYLOAD, "title": f"Req {i} with a long title"})
        assert resp.status_code == 201
        assert resp.json()["req_id"] == f"REQ-00{i+1}"


@pytest.mark.asyncio
async def test_create_missing_required_fields(client):
    resp = await client.post("/api/v1/requirements", json={"title": "short"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_requirements(client):
    await client.post("/api/v1/requirements", json=REQ_PAYLOAD)
    await client.post("/api/v1/requirements", json={**REQ_PAYLOAD, "title": "Another requirement title here"})
    resp = await client.get("/api/v1/requirements")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


@pytest.mark.asyncio
async def test_filter_by_status(client):
    await client.post("/api/v1/requirements", json=REQ_PAYLOAD)
    resp = await client.get("/api/v1/requirements?status=Draft")
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    resp = await client.get("/api/v1/requirements?status=Approved")
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


@pytest.mark.asyncio
async def test_search_by_title(client):
    await client.post("/api/v1/requirements", json=REQ_PAYLOAD)
    await client.post("/api/v1/requirements", json={**REQ_PAYLOAD, "title": "Completely different title here"})
    resp = await client.get("/api/v1/requirements?q=login+must+be+secure")
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


@pytest.mark.asyncio
async def test_status_transition_valid(client):
    create = await client.post("/api/v1/requirements", json=REQ_PAYLOAD)
    req_id = create.json()["req_id"]

    resp = await client.patch(f"/api/v1/requirements/{req_id}/status", json={"status": "Under Review"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "Under Review"

    resp = await client.patch(f"/api/v1/requirements/{req_id}/status", json={"status": "Approved"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "Approved"


@pytest.mark.asyncio
async def test_status_transition_invalid(client):
    create = await client.post("/api/v1/requirements", json=REQ_PAYLOAD)
    req_id = create.json()["req_id"]
    resp = await client.patch(f"/api/v1/requirements/{req_id}/status", json={"status": "Approved"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_add_remove_relation(client):
    r1 = (await client.post("/api/v1/requirements", json=REQ_PAYLOAD)).json()
    r2 = (await client.post("/api/v1/requirements", json={**REQ_PAYLOAD, "title": "Related requirement title long"})).json()

    resp = await client.post(f"/api/v1/requirements/{r1['req_id']}/relations/{r2['req_id']}")
    assert resp.status_code == 200
    related_ids = [r["req_id"] for r in resp.json()["related_requirements"]]
    assert r2["req_id"] in related_ids

    resp = await client.delete(f"/api/v1/requirements/{r1['req_id']}/relations/{r2['req_id']}")
    assert resp.status_code == 200
    assert resp.json()["related_requirements"] == []


@pytest.mark.asyncio
async def test_delete_requirement(client):
    create = await client.post("/api/v1/requirements", json=REQ_PAYLOAD)
    req_id = create.json()["req_id"]
    resp = await client.delete(f"/api/v1/requirements/{req_id}")
    assert resp.status_code == 204
    get_resp = await client.get(f"/api/v1/requirements/{req_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_pagination(client):
    for i in range(10):
        await client.post("/api/v1/requirements", json={**REQ_PAYLOAD, "title": f"Requirement number {i} with a long title"})
    resp = await client.get("/api/v1/requirements?page=1&page_size=3")
    data = resp.json()
    assert data["total"] == 10
    assert len(data["items"]) == 3
    assert data["pages"] == 4
