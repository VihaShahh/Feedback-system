def test_only_current_manager_can_create_for_active_direct_report(sign_in):
    payload = {
        "employee_id": "employee",
        "strengths": "Good collaboration",
        "improvements": "More documentation",
        "sentiment": "positive",
    }
    for role in ["employee", "other", "senior", "admin"]:
        assert sign_in(role).post("/api/v1/feedback", json=payload).status_code == 404
    response = sign_in("manager").post("/api/v1/feedback", json=payload)
    assert response.status_code == 201
    assert response.json()["state"] == "draft" and response.json()["author_id"] == "manager"
