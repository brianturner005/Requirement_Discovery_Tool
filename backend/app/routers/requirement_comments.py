from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.requirement_comment import CommentCreate, CommentResponse, CommentUpdate
from app.services import requirement_comment_service as svc

router = APIRouter(tags=["comments"])


@router.get("/requirements/{req_id}/comments", response_model=list[CommentResponse])
async def list_comments(req_id: str, db: AsyncSession = Depends(get_db)):
    return await svc.list_comments(db, req_id)


@router.post("/requirements/{req_id}/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    req_id: str,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await svc.create_comment(db, req_id, data, author_id=current_user.id)


@router.put("/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: int,
    data: CommentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await svc.update_comment(db, comment_id, data, current_user.id, current_user.is_admin)


@router.delete("/comments/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await svc.delete_comment(db, comment_id, current_user.id, current_user.is_admin)
