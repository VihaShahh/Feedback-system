import pytest
from sqlalchemy import func, select

from backend.app.models import Feedback, Notification, Revision


def test_failed_publication_rolls_back_content_revision_and_notifications(
    sign_in, make_feedback, app, monkeypatch
):
    import importlib

    module = importlib.import_module("backend.app.api.feedback")
    record = make_feedback(publish=False)

    def unavailable(*args, **kwargs):
        raise RuntimeError("Injected notification storage failure")

    monkeypatch.setattr(module, "notify", unavailable)
    with pytest.raises(RuntimeError, match="Injected"):
        sign_in("manager").post(f"/api/v1/feedback/{record['id']}/publish", json={"version": 1})
    with app.state.sessions() as db:
        assert db.get(Feedback, record["id"]).state == "draft"
        assert db.scalar(select(func.count()).select_from(Revision)) == 0
        assert db.scalar(select(func.count()).select_from(Notification)) == 0
