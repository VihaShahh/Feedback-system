"""Run workflow smoke checks against an explicitly supplied, empty PostgreSQL test database."""

import os

from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import inspect

from backend.app.database import make_engine, session_factory
from backend.app.factory import create_app
from backend.app.seed import seed_demo
from backend.app.settings import Settings


def main():
    url = os.environ.get("FEEDBACK_DATABASE_URL", "")
    if not url.startswith("postgresql"):
        raise SystemExit("Supply an empty PostgreSQL test database in FEEDBACK_DATABASE_URL")
    settings = Settings(
        environment="test", database_url=url, allowed_origins=["http://localhost:5173"]
    )
    engine = make_engine(url)
    try:
        if inspect(engine).get_table_names():
            raise SystemExit(
                "Refusing to use a non-empty database; create a disposable test database"
            )
        config = Config("alembic.ini")
        config.attributes["database_url"] = url
        command.upgrade(config, "head")
        command.check(config)
        with session_factory(engine).begin() as db:
            seed_demo(db, "PostgreSQL smoke password 42", settings)
    finally:
        engine.dispose()
    with TestClient(create_app(settings)) as client:
        for person, path in [
            ("alex", "/dashboards/personal"),
            ("maya", "/dashboards/team"),
            ("priya", "/dashboards/organization"),
            ("sam", "/people"),
        ]:
            client.cookies.clear()
            response = client.post(
                "/api/v1/auth/login",
                json={
                    "email": person + "@gather.example.com",
                    "password": "PostgreSQL smoke password 42",
                },
                headers={"Origin": "http://localhost:5173"},
            )
            assert response.status_code == 200, response.text
            response = client.get("/api/v1" + path)
            assert response.status_code == 200, response.text
            if person == "maya":
                assert response.json()["metrics"]["team_size"] == 4
            if person == "priya":
                assert not response.json()["suppressed"]
            if person == "sam":
                assert client.get("/api/v1/feedback").json()["total"] == 0
    print("PostgreSQL migrations, schema parity and four role workflows passed")


if __name__ == "__main__":
    main()
