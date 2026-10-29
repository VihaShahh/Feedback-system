def test_feedback_requests_are_owned_deduplicated_and_fulfilled_by_published_record(
    sign_in, make_feedback
):
    client = sign_in("employee")
    body = {"topic": "My project delivery", "note": "Review communication and ownership"}
    request = client.post("/api/v1/requests", json=body)
    assert request.status_code == 201
    row = request.json()
    assert client.post("/api/v1/requests", json=body).status_code == 409
    assert sign_in("other").get("/api/v1/requests").json()["total"] == 0
    assert sign_in("manager").get("/api/v1/requests").json()["total"] == 1
    record = make_feedback()
    path = f"/api/v1/requests/{row['id']}/fulfil"
    assert sign_in("employee").post(path, json={"feedback_id": record["id"]}).status_code == 404
    client = sign_in("manager")
    assert client.post(path, json={"feedback_id": record["id"]}).json()["state"] == "fulfilled"
    assert client.post(path, json={"feedback_id": record["id"]}).status_code == 409
    assert (
        sign_in("employee").get("/api/v1/requests").json()["items"][0]["feedback_id"]
        == record["id"]
    )


def test_request_requires_manager_and_owner_alone_can_cancel(sign_in):
    assert (
        sign_in("senior").post("/api/v1/requests", json={"topic": "No manager"}).status_code == 409
    )
    row = sign_in("employee").post("/api/v1/requests", json={"topic": "Development"}).json()
    assert sign_in("peer").post(f"/api/v1/requests/{row['id']}/cancel").status_code == 404
    assert sign_in("employee").post(f"/api/v1/requests/{row['id']}/cancel").status_code == 204
