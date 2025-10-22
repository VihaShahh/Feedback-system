def test_permission_metadata_and_sessions_never_expose_cookie_hashes(sign_in):
    client = sign_in("employee")
    assert not client.get("/api/v1/access").json()["capabilities"]["people_manage"]
    data = client.get("/api/v1/auth/sessions")
    assert "hash" not in data.text and "token" not in data.text
    row = data.json()["items"][0]
    assert row["current"]
    assert sign_in("peer").delete(f"/api/v1/auth/sessions/{row['id']}").status_code == 404
    client = sign_in("employee")
    assert client.delete(f"/api/v1/auth/sessions/{row['id']}").status_code == 204
