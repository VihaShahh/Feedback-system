def test_draft_updates_reject_stale_versions_and_foreign_authors(sign_in, make_feedback):
    record = make_feedback(publish=False)
    path = f"/api/v1/feedback/{record['id']}"
    payload = {key: record[key] for key in ["strengths", "improvements", "sentiment", "version"]}
    payload["strengths"] = "Improved ownership and communication"
    client = sign_in("manager")
    response = client.patch(path, json=payload)
    assert response.status_code == 200 and response.json()["version"] == 2
    assert client.patch(path, json=payload).status_code == 409
    assert client.get(path + "/revisions").json()["items"] == []
    assert sign_in("other").patch(path, json=payload).status_code == 404
