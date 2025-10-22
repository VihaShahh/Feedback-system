from backend.app.models import Grant


def test_organization_permission_does_not_expose_directory_or_feedback_bodies(
    sign_in, make_feedback, app
):
    record = make_feedback()
    with app.state.sessions.begin() as db:
        db.add(Grant(user_id="employee", permission="dashboard.organization"))
    client = sign_in("employee")
    assert client.get("/api/v1/dashboards/organization/directory-summary").status_code == 200
    assert client.get("/api/v1/people").json()["total"] == 1
    assert client.get("/api/v1/feedback").json()["total"] == 1
    senior = sign_in("senior")
    assert senior.get(f"/api/v1/feedback/{record['id']}").status_code == 404
    assert sign_in("admin").get("/api/v1/dashboards/organization").status_code == 403
