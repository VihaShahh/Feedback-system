def test_publication_records_revision_and_rejects_repeat_or_recipient_action(
    sign_in, make_feedback
):
    record = make_feedback(publish=False)
    path = f"/api/v1/feedback/{record['id']}"
    assert sign_in("employee").post(path + "/publish", json={"version": 1}).status_code == 404
    client = sign_in("manager")
    assert client.post(path + "/publish", json={"version": 99}).status_code == 409
    published = client.post(path + "/publish", json={"version": 1}).json()
    assert published["state"] == "published" and published["published_at"]
    assert client.post(path + "/publish", json={"version": published["version"]}).status_code == 409
    assert sign_in("employee").get(path).status_code == 200
