def test_goal_progress_completion_versions_and_cancellation(sign_in):
    client = sign_in("employee")
    goal = client.post("/api/v1/goals", json={"title": "Complete a mentoring plan"}).json()
    path = f"/api/v1/goals/{goal['id']}"
    assert client.patch(path, json={"version": 1, "progress": 101}).status_code == 422
    response = client.patch(path, json={"version": 1, "progress": 100})
    assert response.json()["state"] == "completed"
    assert client.patch(path, json={"version": 1, "progress": 50}).status_code == 409
    response = client.patch(path, json={"version": 2, "state": "active", "progress": 50})
    assert response.json()["state"] == "active" and response.json()["progress"] == 50
    assert client.patch(path, json={"version": 3, "state": "cancelled"}).status_code == 200
    assert client.patch(path, json={"version": 4, "state": "active"}).status_code == 409
