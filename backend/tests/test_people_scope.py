def test_directory_scopes_and_secret_projection(sign_in):
    client = sign_in("employee")
    data = client.get("/api/v1/people").json()
    assert [u["id"] for u in data["items"]] == ["employee"]
    client = sign_in("manager")
    response = client.get("/api/v1/people")
    assert {u["id"] for u in response.json()["items"]} == {"manager", "employee", "peer", "third"}
    assert "password" not in response.text
    assert len(sign_in("admin").get("/api/v1/people").json()["items"]) == 8


def test_team_directory_and_person_detail_share_current_reporting_scope(sign_in):
    client = sign_in("manager")
    assert client.get("/api/v1/people?team_only=true").json()["total"] == 3
    assert client.get("/api/v1/people/employee").status_code == 200
    assert client.get("/api/v1/people/outsider").status_code == 404
    assert sign_in("employee").get("/api/v1/people?team_only=true").status_code == 403
