import os
import uuid
from pathlib import Path

import aiofiles
import httpx
from fastapi import HTTPException, UploadFile
from fastapi.responses import FileResponse, RedirectResponse, Response

from app.config import settings

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg", ".txt", ".csv", ".md"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/msword",
    "application/vnd.ms-excel",
    "image/png",
    "image/jpeg",
    "text/plain",
    "text/csv",
    "text/markdown",
    "application/octet-stream",
}
MAX_BYTES = settings.max_upload_size_mb * 1024 * 1024

VERCEL_BLOB_API = "https://blob.vercel-storage.com"


class LocalDiskStorage:
    """Default backend. Files live under settings.upload_dir, one folder per
    requirement. `stored_ref` is "{req_db_id}/{uuid}{suffix}" — self-contained,
    so download/delete don't need the requirement id passed separately."""

    def _resolve(self, stored_ref: str) -> Path:
        base = Path(settings.upload_dir).resolve()
        file_path = (base / stored_ref).resolve()
        if not str(file_path).startswith(str(base)):
            raise HTTPException(status_code=400, detail="Invalid file path")
        return file_path

    async def save(self, req_db_id: int, stored_name: str, content: bytes, content_type: str) -> str:
        stored_ref = f"{req_db_id}/{stored_name}"
        file_path = self._resolve(stored_ref)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)
        return stored_ref

    async def download_response(self, stored_ref: str, filename: str, content_type: str | None) -> Response:
        file_path = self._resolve(stored_ref)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on disk")
        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type=content_type or "application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    async def delete(self, stored_ref: str) -> None:
        file_path = self._resolve(stored_ref)
        file_path.unlink(missing_ok=True)


class VercelBlobStorage:
    """For serverless hosts (Vercel) where local disk doesn't persist across
    invocations. Talks to the Vercel Blob REST API directly — there's no
    official Python SDK, only the JS one. `stored_ref` is the full blob URL
    Vercel returns on upload, so download/delete need no reconstruction.

    Needs BLOB_READ_WRITE_TOKEN, which Vercel injects automatically once a
    Blob store is linked to the project.

    NOTE: built against Vercel's documented Blob REST API but not exercised
    against a live store from this environment — smoke-test upload/download/
    delete once BLOB_READ_WRITE_TOKEN is set in the deployed project.
    """

    def _token(self) -> str:
        token = os.environ.get("BLOB_READ_WRITE_TOKEN")
        if not token:
            raise HTTPException(status_code=500, detail="BLOB_READ_WRITE_TOKEN is not configured")
        return token

    async def save(self, req_db_id: int, stored_name: str, content: bytes, content_type: str) -> str:
        pathname = f"evidence/{req_db_id}/{stored_name}"
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.put(
                f"{VERCEL_BLOB_API}/{pathname}",
                content=content,
                headers={
                    "Authorization": f"Bearer {self._token()}",
                    "x-api-version": "7",
                    "x-content-type": content_type or "application/octet-stream",
                    "x-add-random-suffix": "0",
                },
            )
        if resp.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Evidence storage upload failed: {resp.text}")
        return resp.json()["url"]

    async def download_response(self, stored_ref: str, filename: str, content_type: str | None) -> Response:
        return RedirectResponse(url=stored_ref)

    async def delete(self, stored_ref: str) -> None:
        async with httpx.AsyncClient(timeout=30) as http:
            await http.request(
                "DELETE",
                VERCEL_BLOB_API,
                headers={"Authorization": f"Bearer {self._token()}", "x-api-version": "7"},
                json={"urls": [stored_ref]},
            )


def _backend():
    if settings.storage_backend == "vercel_blob":
        return VercelBlobStorage()
    return LocalDiskStorage()


def _safe_stored_filename(original: str) -> str:
    suffix = Path(original).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"File type '{suffix}' not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    return f"{uuid.uuid4().hex}{suffix}"


async def save_upload(req_db_id: int, file: UploadFile) -> dict:
    original_filename = file.filename or "unnamed"
    stored_name = _safe_stored_filename(original_filename)

    content = await file.read()
    total_size = len(content)
    if total_size > MAX_BYTES:
        raise HTTPException(
            status_code=422,
            detail=f"File too large. Max size: {settings.max_upload_size_mb} MB",
        )

    content_type = file.content_type or "application/octet-stream"
    stored_ref = await _backend().save(req_db_id, stored_name, content, content_type)

    return {
        "filename": original_filename,
        "stored_filename": stored_ref,
        "content_type": content_type,
        "file_size": total_size,
    }


async def get_download_response(stored_ref: str, filename: str, content_type: str | None) -> Response:
    return await _backend().download_response(stored_ref, filename, content_type)


async def delete_file(stored_ref: str) -> None:
    try:
        await _backend().delete(stored_ref)
    except HTTPException:
        pass
