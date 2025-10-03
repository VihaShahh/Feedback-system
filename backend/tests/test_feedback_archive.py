def test_archive_retains_history_and_cannot_disclose_a_draft(sign_in, make_feedback):
    draft = make_feedback(publish=False)
    client = sign_in("manager")
    assert (
        client.post(f"/api/v1/feedback/{draft['id']}/archive", json={"version": 1}).status_code
        == 409
    )
    record = make_feedback()
    path = f"/api/v1/feedback/{record['id']}"
    client = sign_in("manager")
    assert client.post(path + "/archive", json={"version": 2}).status_code == 200
    assert (
        client.patch(
            path,
            json={
                "version": 3,
                "strengths": "changed",
                "improvements": "more",
                "sentiment": "positive",
            },
        ).status_code
        == 409
    )
    employee = sign_in("employee")
    assert employee.get("/api/v1/feedback").json()["total"] == 0
    assert employee.get(path).json()["state"] == "archived"
    assert len(employee.get(path + "/revisions").json()["items"]) == 1
