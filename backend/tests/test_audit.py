def test_audit_is_restricted_and_contains_no_feedback_narrative(sign_in, make_feedback):
    record = make_feedback()
    for role in ["employee", "manager", "senior"]:
        assert sign_in(role).get("/api/v1/audit").status_code == 403
    response = sign_in("admin").get("/api/v1/audit?action=feedback.published")
    assert response.status_code == 200 and response.json()["total"] == 1
    assert record["strengths"] not in response.text
    assert record["improvements"] not in response.text
    assert "password" not in response.text
    assert response.json()["items"][0]["resource_id"] == record["id"]
