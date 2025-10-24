from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient

from backend.app.factory import create_app

from .conftest import ORIGIN, PASSWORD


def test_published_feedback_survives_new_application_instance(app, make_feedback):
    record = make_feedback()
    second = create_app(app.state.settings)
    with TestClient(second) as client:
        assert (
            client.post(
                "/api/v1/auth/login",
                json={"email": "employee@example.com", "password": PASSWORD},
                headers={"Origin": ORIGIN},
            ).status_code
            == 200
        )
        assert (
            client.get(f"/api/v1/feedback/{record['id']}").json()["strengths"]
            == record["strengths"]
        )
        assert len(client.get(f"/api/v1/feedback/{record['id']}/revisions").json()["items"]) == 1
    cfg = Config("alembic.ini")
    cfg.attributes["database_url"] = app.state.settings.database_url
    command.check(cfg)
