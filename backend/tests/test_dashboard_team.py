def test_manager_dashboard_excludes_unrelated_team_and_private_drafts(sign_in, make_feedback):
    make_feedback(sentiment="needs_attention")
    make_feedback("outsider")
    make_feedback("peer", publish=False)
    client = sign_in("manager")
    data = client.get("/api/v1/dashboards/team").json()
    assert data["metrics"]["team_size"] == 3
    assert data["metrics"]["feedback_shared"] == 1
    assert data["metrics"]["needs_attention"] == 1
    assert {row["id"] for row in data["team"]} == {"employee", "peer", "third"}
    assert sign_in("employee").get("/api/v1/dashboards/team").status_code == 403
