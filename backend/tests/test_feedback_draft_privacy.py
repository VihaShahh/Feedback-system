from backend.app.models import Grant


def test_unpublished_draft_stays_author_private_even_with_content_grant(
    sign_in, make_feedback, app
):
    record = make_feedback(publish=False)
    with app.state.sessions.begin() as db:
        db.add(Grant(user_id="senior", permission="feedback.read_organization"))
    for role in ["employee", "peer", "other", "senior", "admin"]:
        client = sign_in(role)
        assert client.get(f"/api/v1/feedback/{record['id']}").status_code == 404
        assert client.get("/api/v1/feedback").json()["total"] == 0
    assert (
        sign_in("manager").get(f"/api/v1/feedback/{record['id']}").json()["capabilities"]["publish"]
    )
