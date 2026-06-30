from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import settings


def _build_engine_kwargs(database_url: str) -> tuple[str, dict]:
    """Normalize the URL and pick driver/pool settings per backend.

    SQLite needs check_same_thread=False for the async driver. Postgres
    (e.g. Neon, used on Vercel's serverless functions) needs the asyncpg
    driver, SSL enabled, and NullPool — serverless function instances are
    short-lived, so a persistent connection pool just accumulates dead
    connections across cold starts.
    """
    if database_url.startswith("sqlite"):
        return database_url, {"connect_args": {"check_same_thread": False}}

    url = database_url
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]

    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query))
    # asyncpg takes SSL via connect_args, not a "sslmode" query param.
    query.pop("sslmode", None)
    url = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))

    return url, {"connect_args": {"ssl": True}, "poolclass": NullPool}


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
