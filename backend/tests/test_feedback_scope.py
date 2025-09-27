def test_feedback_queries_are_scoped_before_pagination(sign_in, make_feedback):
    own = make_feedback()
    foreign = make_feedback("outsider")
    assert sign_in("employee").get("/api/v1/feedback").json()["total"] == 1
    client = sign_in("manager")
    assert {x["id"] for x in client.get("/api/v1/feedback").json()["items"]} == {own["id"]}
    assert client.get(f"/api/v1/feedback/{foreign['id']}").status_code == 404
    assert sign_in("peer").get(f"/api/v1/feedback/{own['id']}").status_code == 404
