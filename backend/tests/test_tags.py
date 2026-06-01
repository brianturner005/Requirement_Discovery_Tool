import pytest

REQ_PAYLOAD = {
    "title": "Tagged requirement with a suitably long title",
    "description": "Requirement used for verifying tag association and usage count",
    "source": "SME Interview",
    "priority": "Medium",
    "confidence": "High",
}


@pytest.mark.asyncio
async def test_create_tag(client):
    resp = await client.post("/api/v1/tags", json={"name": "security"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "security"


@pytest.mark.asyncio
async def test_create_tag_idempotent(client):
    first = await client.post("/api/v1/tags", json={"name": "security"})
    second = await client.post("/api/v1/tags", json={"name": "security"})
    assert second.status_code == 201
    assert first.json()["id"] == second.json()["id"]


@pytest.mark.asyncio
async def test_list_tags(client):
    await client.post("/api/v1/tags", json={"name": "security"})
    await client.post("/api/v1/tags", json={"name": "performance"})
    resp = await client.get("/api/v1/tags")
    assert resp.status_code == 200
    names = [t["name"] for t in resp.json()]
    assert "security" in names
    assert "performance" in names


@pytest.mark.asyncio
async def test_tag_usage_count(client):
    tag = (await client.post("/api/v1/tags", json={"name": "auth"})).json()

    await client.post("/api/v1/requirements", json={**REQ_PAYLOAD, "tag_names": ["auth"]})
    await client.post("/api/v1/requirements", json={**REQ_PAYLOAD, "title": "Another auth requirement long title", "tag_names": ["auth"]})

    resp = await client.get("/api/v1/tags")
    auth_tag = next(t for t in resp.json() if t["id"] == tag["id"])
    assert auth_tag["usage_count"] == 2


@pytest.mark.asyncio
async def test_delete_tag(client):
    create = await client.post("/api/v1/tags", json={"name": "obsolete"})
    tid = create.json()["id"]
    resp = await client.delete(f"/api/v1/tags/{tid}")
    assert resp.status_code == 204
    tags = (await client.get("/api/v1/tags")).json()
    assert not any(t["id"] == tid for t in tags)


@pytest.mark.asyncio
async def test_delete_tag_not_found(client):
    resp = await client.delete("/api/v1/tags/9999")
    assert resp.status_code == 404
