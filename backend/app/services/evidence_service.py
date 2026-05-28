import uuid
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile

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


def _get_upload_dir(req_id: str) -> Path:
    base = Path(settings.upload_dir).resolve()
    target = (base / str(req_id)).resolve()
    if not str(target).startswith(str(base)):
        raise HTTPException(status_code=400, detail="Invalid requirement ID in upload path")
    return target


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
    suffix = Path(original_filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"File type '{suffix}' not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    stored_name = f"{uuid.uuid4().hex}{suffix}"
    upload_dir = _get_upload_dir(str(req_db_id))
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / stored_name
    total_size = 0
    content = await file.read()
    total_size = len(content)

    if total_size > MAX_BYTES:
        raise HTTPException(
            status_code=422,
            detail=f"File too large. Max size: {settings.max_upload_size_mb} MB",
        )

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    content_type = file.content_type or "application/octet-stream"

    return {
        "filename": original_filename,
        "stored_filename": stored_name,
        "content_type": content_type,
        "file_size": total_size,
    }


def get_file_path(req_db_id: int, stored_filename: str) -> Path:
    base = Path(settings.upload_dir).resolve()
    file_path = (base / str(req_db_id) / stored_filename).resolve()
    if not str(file_path).startswith(str(base)):
        raise HTTPException(status_code=400, detail="Invalid file path")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    return file_path


async def delete_file(req_db_id: int, stored_filename: str) -> None:
    try:
        file_path = get_file_path(req_db_id, stored_filename)
        file_path.unlink(missing_ok=True)
    except HTTPException:
        pass
