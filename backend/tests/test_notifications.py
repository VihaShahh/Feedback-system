def test_notifications_are_owner_scoped_and_mark_read_idempotently(sign_in, make_feedback):
    record = make_feedback()
    client = sign_in("employee")
    data = client.get("/api/v1/notifications").json()
    assert data["unread"] == data["total"] == 1
    notification = data["items"][0]
    assert notification["resource_id"] == record["id"]
    assert (
        sign_in("peer").post(f"/api/v1/notifications/{notification['id']}/read").status_code == 404
    )
    client = sign_in("employee")
    for _ in range(2):
        assert client.post(f"/api/v1/notifications/{notification['id']}/read").status_code == 204
    assert client.get("/api/v1/notifications?unread_only=true").json()["total"] == 0
    assert client.get("/api/v1/notifications").json()["unread"] == 0
