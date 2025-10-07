def test_escalation_discloses_one_published_record_to_senior_and_can_be_resolved(
    sign_in, make_feedback
):
    record = make_feedback()
    other = make_feedback("peer")
    path = f"/api/v1/feedback/{record['id']}"
    assert sign_in("senior").get(path).status_code == 404
    assert (
        sign_in("employee")
        .post(path + "/escalate", json={"version": 2, "note": "Please help us align expectations"})
        .status_code
        == 200
    )
    client = sign_in("senior")
    assert client.get(path).status_code == 200
    assert client.get(f"/api/v1/feedback/{other['id']}").status_code == 404
    assert (
        client.post(
            path + "/resolve", json={"note": "Agreed a shared development plan"}
        ).status_code
        == 200
    )
    assert client.post(path + "/resolve", json={"note": "Duplicate resolution"}).status_code == 409
    assert sign_in("employee").get(path).json()["resolved_at"]
