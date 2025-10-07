def test_feedback_filters_cannot_expand_visibility(sign_in, make_feedback):
    own = make_feedback(sentiment="balanced")
    make_feedback("peer", sentiment="positive")
    make_feedback("outsider", sentiment="balanced")
    client = sign_in("manager")
    assert client.get("/api/v1/feedback?sentiment=balanced").json()["total"] == 1
    assert client.get("/api/v1/feedback?employee_id=outsider").json()["total"] == 0
    assert client.get("/api/v1/feedback?state=published&limit=1").json()["total"] == 2
    assert client.get("/api/v1/feedback?sentiment=unknown").status_code == 422
    assert client.get("/api/v1/feedback?limit=0").status_code == 422
    assert (
        sign_in("employee")
        .get(f"/api/v1/feedback?employee_id={own['employee_id']}")
        .json()["total"]
        == 1
    )
