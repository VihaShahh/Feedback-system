from functools import lru_cache
from pathlib import Path

from alembic.script import ScriptDirectory
from alembic.util.exc import CommandError
from fastapi import APIRouter, Request
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from ..errors import fail

router = APIRouter(tags=["Health"])


@router.get("/health")
def health():
    return {"status": "ok"}


@lru_cache(maxsize=1)
def schema_heads():
    migrations = Path(__file__).resolve().parents[2] / "migrations"
    return frozenset(ScriptDirectory(str(migrations)).get_heads())


@router.get("/ready")
def ready(request: Request):
    try:
        with request.app.state.engine.connect() as connection:
            applied = set(connection.scalars(text("SELECT version_num FROM alembic_version")))
        if applied != schema_heads():
            fail(503, "Database migrations are required")
    except (SQLAlchemyError, CommandError, OSError):
        fail(503, "Database migrations are required")
    return {"status": "ready"}
