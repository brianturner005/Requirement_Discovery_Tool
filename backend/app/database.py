from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import settings


def _build_engine_kwargs(database_url: str) -> tuple[str, dict]:
    """Normalize the URL and pick driver/pool settings per backend.

    SQLite keeps its existing aiosqlite driver. Postgres uses psycopg3
    (psycopg[binary]) which ships pre-built wheels for every CPython
    version, avoiding C-compilation issues on hosts like Vercel. NullPool
    avoids stale connections across serverless cold starts.
    """
    if database_url.startswith("sqlite"):
        return database_url, {"connect_args": {"check_same_thread": False}}

    url = database_url
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        # psycopg3 async dialect; psycopg[binary] passes sslmode through to
        # libpq natively, so no need to strip it from the query string.
        url = "postgresql+psycopg://" + url[len("postgresql://"):]

    return url, {"poolclass": NullPool}


_url, _engine_kwargs = _build_engine_kwargs(settings.database_url)

engine = create_async_engine(
    _url,
    echo=False,
    **_engine_kwargs,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def run_migrations():
    from sqlalchemy import text
    stmts = [
        "ALTER TABLE requirements ADD COLUMN IF NOT EXISTS jira_issue_key VARCHAR(50)",
        "ALTER TABLE requirements ADD COLUMN IF NOT EXISTS linear_issue_id VARCHAR(100)",
    ]
    async with engine.begin() as conn:
        for stmt in stmts:
            try:
                await conn.execute(text(stmt))
            except Exception:
                pass
