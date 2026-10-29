def test_reporting_transfer_revokes_former_manager_content_access(sign_in, make_feedback):
    record = make_feedback()
    draft = make_feedback(publish=False)
    client = sign_in("admin")
    assert client.patch("/api/v1/people/employee", json={"manager_id": "other"}).status_code == 200
    old = sign_in("manager")
    assert old.get(f"/api/v1/feedback/{record['id']}").status_code == 404
    assert old.get(f"/api/v1/feedback/{draft['id']}").status_code == 404
    new = sign_in("other")
    assert new.get(f"/api/v1/feedback/{record['id']}").status_code == 200
    assert new.get(f"/api/v1/feedback/{draft['id']}").status_code == 404
    assert not new.get(f"/api/v1/feedback/{record['id']}").json()["capabilities"]["edit"]
