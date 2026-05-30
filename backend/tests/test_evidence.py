import io

import pytest

REQ_PAYLOAD = {
    "title": "Evidence test requirement with a suitably long title",
    "description": "Requirement used to verify file upload, download, and delete behaviour",
    "source": "SME Interview",
    "priority": "Medium",
    "confidence": "High",
}


@pytest.fixture(autouse=True)
def patch_upload_dir(tmp_path, monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))


async def _create_req(client):
    return (await client.post("/api/v1/requirements", json=REQ_PAYLOAD)).json()


@pytest.mark.asyncio
async def test_upload_evidence(client):
    req = await _create_req(client)
    content = b"Sample PDF file content"
    files = {"file": ("report.pdf", io.BytesIO(content), "application/pdf")}
    resp = await client.post(f"/api/v1/requirements/{req['req_id']}/evidence", files=files)
    assert resp.status_code == 201
    data = resp.json()
    assert data["filename"] == "report.pdf"
    assert data["file_size"] == len(content)
    assert data["content_type"] == "application/pdf"


@pytest.mark.asyncio
async def test_list_evidence(client):
    req = await _create_req(client)
    files = {"file": ("a.txt", io.BytesIO(b"hello"), "text/plain")}
    await client.post(f"/api/v1/requirements/{req['req_id']}/evidence", files=files)
    files = {"file": ("b.txt", io.BytesIO(b"world"), "text/plain")}
    await client.post(f"/api/v1/requirements/{req['req_id']}/evidence", files=files)

    resp = await client.get(f"/api/v1/requirements/{req['req_id']}/evidence")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_download_evidence(client):
    req = await _create_req(client)
    content = b"Downloadable content here"
    files = {"file": ("notes.txt", io.BytesIO(content), "text/plain")}
    upload = await client.post(f"/api/v1/requirements/{req['req_id']}/evidence", files=files)
    ev_id = upload.json()["id"]

    resp = await client.get(f"/api/v1/evidence/{ev_id}/download")
    assert resp.status_code == 200
    assert resp.content == content


@pytest.mark.asyncio
async def test_delete_evidence(client):
    req = await _create_req(client)
    files = {"file": ("temp.txt", io.BytesIO(b"bye"), "text/plain")}
    upload = await client.post(f"/api/v1/requirements/{req['req_id']}/evidence", files=files)
    ev_id = upload.json()["id"]

    resp = await client.delete(f"/api/v1/evidence/{ev_id}")
    assert resp.status_code == 204

    remaining = await client.get(f"/api/v1/requirements/{req['req_id']}/evidence")
    assert remaining.json() == []


@pytest.mark.asyncio
async def test_disallowed_file_type_rejected(client):
    req = await _create_req(client)
    files = {"file": ("payload.exe", io.BytesIO(b"bad"), "application/octet-stream")}
    resp = await client.post(f"/api/v1/requirements/{req['req_id']}/evidence", files=files)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_upload_to_nonexistent_requirement(client):
    files = {"file": ("test.pdf", io.BytesIO(b"content"), "application/pdf")}
    resp = await client.post("/api/v1/requirements/REQ-9999/evidence", files=files)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_oversized_file_rejected(client, monkeypatch):
    import app.services.evidence_service as ev_svc
    monkeypatch.setattr(ev_svc, "MAX_BYTES", 10)

    req = await _create_req(client)
    files = {"file": ("big.txt", io.BytesIO(b"x" * 11), "text/plain")}
    resp = await client.post(f"/api/v1/requirements/{req['req_id']}/evidence", files=files)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_evidence_list_for_nonexistent_requirement(client):
    resp = await client.get("/api/v1/requirements/REQ-9999/evidence")
    assert resp.status_code == 404
