from sqlalchemy import update

from backend.app.models import Feedback


def test_month_filter_is_scoped_and_rejects_invalid_calendar_values(sign_in, make_feedback, app):
    record = make_feedback()
    with app.state.sessions.begin() as db:
        db.execute(
            update(Feedback)
            .where(Feedback.id == record["id"])
            .values(published_at="2025-10-14T10:00:00+00:00")
        )
    client = sign_in("employee")
    assert (
        client.get("/api/v1/dashboards/personal?month=2025-10").json()["metrics"][
            "feedback_received"
        ]
        == 1
    )
    assert (
        client.get("/api/v1/dashboards/personal?month=2025-11").json()["metrics"][
            "feedback_received"
        ]
        == 0
    )
    for month in ["2025-13", "0000-01", "9999-12"]:
        assert client.get("/api/v1/dashboards/personal?month=" + month).status_code == 422
    assert (
        client.get("/api/v1/dashboards/personal?cycle_id=nonexistent").json()["metrics"][
            "feedback_received"
        ]
        == 0
    )
