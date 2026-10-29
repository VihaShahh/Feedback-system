def test_administration_does_not_imply_feedback_reading_or_editing(sign_in, make_feedback):
    record = make_feedback()
    client = sign_in("admin")
    assert client.get("/api/v1/people").json()["total"] == 8
    assert client.get("/api/v1/feedback").json()["total"] == 0
    assert client.get(f"/api/v1/feedback/{record['id']}").status_code == 404
    assert (
        client.post(f"/api/v1/feedback/{record['id']}/acknowledge", json={"version": 2}).status_code
        == 404
    )
