"""Owned, disposable backend for real browser journeys. Never touches the workspace DB."""

import os
import tempfile
from pathlib import Path

import uvicorn
from alembic import command
from alembic.config import Config

from backend.app.database import make_engine, session_factory
from backend.app.factory import create_app
from backend.app.seed import seed_demo
from backend.app.settings import Settings

root = Path(__file__).resolve().parents[1]
os.chdir(root)

with tempfile.TemporaryDirectory(prefix="feedback-browser-") as directory:
    url = f"sqlite:///{directory}/browser.db"
    config = Config(str(root / "alembic.ini"))
    config.attributes["database_url"] = url
    command.upgrade(config, "head")
    settings = Settings(
        environment="test",
        database_url=url,
        allowed_origins=["http://127.0.0.1:5179"],
        login_attempts=50,
    )
    engine = make_engine(url)
    with session_factory(engine).begin() as db:
        seed_demo(db, "Browser test password 42", settings)
    engine.dispose()
    uvicorn.run(create_app(settings), host="127.0.0.1", port=8097, log_level="warning")
