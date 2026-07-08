from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.requirement import Requirement
from app.models.requirement_comment import RequirementComment
from app.schemas.requirement_comment import CommentCreate, CommentUpdate


def _load_opts():
    return [selectinload(RequirementComment.author)]


async def _get_requirement_pk(db: AsyncSession, req_id: str) -> int:
    result = await db.execute(select(Requirement.id).where(Requirement.req_id == req_id))
    pk = result.scalar_one_or_none()
    if pk is None:
        raise HTTPException(status_code=404, detail="Requirement not found")
    return pk


async def list_comments(db: AsyncSession, req_id: str) -> list[RequirementComment]:
    req_pk = await _get_requirement_pk(db, req_id)
    result = await db.execute(
        select(RequirementComment)
        .options(*_load_opts())
        .where(RequirementComment.requirement_id == req_pk)
        .order_by(RequirementComment.created_at.asc())
    )
    return list(result.scalars().all())


async def create_comment(
    db: AsyncSession, req_id: str, data: CommentCreate, author_id: int
) -> RequirementComment:
    req_pk = await _get_requirement_pk(db, req_id)
    if not data.body.strip():
        raise HTTPException(status_code=422, detail="Comment body cannot be empty")
    comment = RequirementComment(
        requirement_id=req_pk,
        author_id=author_id,
        body=data.body.strip(),
    )
    db.add(comment)
    await db.flush()
    result = await db.execute(
        select(RequirementComment).options(*_load_opts()).where(RequirementComment.id == comment.id)
    )
    return result.scalar_one()


async def update_comment(
    db: AsyncSession, comment_id: int, data: CommentUpdate, current_user_id: int, is_admin: bool
) -> RequirementComment:
    result = await db.execute(
        select(RequirementComment).options(*_load_opts()).where(RequirementComment.id == comment_id)
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if not is_admin and comment.author_id != current_user_id:
        raise HTTPException(status_code=403, detail="Cannot edit another user's comment")
    if not data.body.strip():
        raise HTTPException(status_code=422, detail="Comment body cannot be empty")
    comment.body = data.body.strip()
    comment.is_edited = True
    await db.flush()
    result = await db.execute(
        select(RequirementComment).options(*_load_opts()).where(RequirementComment.id == comment_id)
    )
    return result.scalar_one()


async def delete_comment(db: AsyncSession, comment_id: int, current_user_id: int, is_admin: bool) -> None:
    result = await db.execute(select(RequirementComment).where(RequirementComment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if not is_admin and comment.author_id != current_user_id:
        raise HTTPException(status_code=403, detail="Cannot delete another user's comment")
    await db.delete(comment)
    await db.flush()
