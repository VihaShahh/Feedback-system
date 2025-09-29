def test_only_recipient_acknowledges_current_version_idempotently(sign_in, make_feedback):
    record = make_feedback()
    path = f"/api/v1/feedback/{record['id']}/acknowledge"
    assert sign_in("manager").post(path, json={"version": record["version"]}).status_code == 403
    client = sign_in("employee")
    assert client.post(path, json={"version": record["version"] - 1}).status_code == 409
    first = client.post(path, json={"version": record["version"]})
    second = client.post(path, json={"version": record["version"]})
    assert first.status_code == second.status_code == 200
    assert first.json()["acknowledged_at"] == second.json()["acknowledged_at"]
    assert not second.json()["capabilities"]["acknowledge"]
