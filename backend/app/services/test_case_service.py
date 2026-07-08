from fastapi import HTTPException
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.test_case import TestCase
from app.schemas.test_case import TestCaseCreate, TestCaseUpdate


def _load_options():
    return [selectinload(TestCase.requirement)]


async def get_test_case(db: AsyncSession, test_case_id: int) -> TestCase:
    result = await db.execute(
        select(TestCase).options(*_load_options()).where(TestCase.id == test_case_id)
    )
    tc = result.scalar_one_or_none()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")
    return tc


async def list_test_cases(
    db: AsyncSession,
    q: str | None = None,
    status: list[str] | None = None,
    requirement_id: int | None = None,
    sort_by: str = "updated_at",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 25,
) -> tuple[list[TestCase], int]:
    filters = []
    if q:
        search = f"%{q}%"
        filters.append(or_(TestCase.title.ilike(search), TestCase.steps.ilike(search)))
    if status:
        filters.append(TestCase.status.in_(status))
    if requirement_id:
        filters.append(TestCase.requirement_id == requirement_id)

    base_q = select(TestCase).options(*_load_options())
    count_q = select(func.count(TestCase.id))
    if filters:
        base_q = base_q.where(and_(*filters))
        count_q = count_q.where(and_(*filters))

    total = (await db.execute(count_q)).scalar() or 0
    sort_col = getattr(TestCase, sort_by, TestCase.updated_at)
    base_q = base_q.order_by(sort_col.asc() if sort_dir == "asc" else sort_col.desc())
    base_q = base_q.offset((page - 1) * page_size).limit(page_size)
    items = list((await db.execute(base_q)).scalars().all())
    return items, total


async def create_test_case(db: AsyncSession, data: TestCaseCreate) -> TestCase:
    tc = TestCase(
        title=data.title,
        description=data.description,
        preconditions=data.preconditions,
        steps=data.steps,
        expected_result=data.expected_result,
        status=data.status.value,
        requirement_id=data.requirement_id,
    )
    db.add(tc)
    await db.flush()
    return await get_test_case(db, tc.id)


async def update_test_case(db: AsyncSession, test_case_id: int, data: TestCaseUpdate) -> TestCase:
    tc = await get_test_case(db, test_case_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        if hasattr(tc, field):
            setattr(tc, field, value.value if hasattr(value, "value") else value)
    await db.flush()
    return await get_test_case(db, test_case_id)


async def delete_test_case(db: AsyncSession, test_case_id: int) -> None:
    tc = await get_test_case(db, test_case_id)
    await db.delete(tc)
    await db.flush()
