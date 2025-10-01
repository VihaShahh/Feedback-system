def test_revising_content_clears_acknowledgement_and_rejects_old_version(sign_in, make_feedback):
    record = make_feedback()
    path = f"/api/v1/feedback/{record['id']}"
    assert sign_in("employee").post(path + "/acknowledge", json={"version": 2}).status_code == 200
    response = sign_in("manager").patch(
        path,
        json={
            "version": 2,
            "strengths": "New published assessment",
            "improvements": record["improvements"],
            "sentiment": "balanced",
        },
    )
    assert response.status_code == 200 and response.json()["acknowledged_at"] is None
    client = sign_in("employee")
    assert client.post(path + "/acknowledge", json={"version": 2}).status_code == 409
    assert client.get(path).json()["capabilities"]["acknowledge"]
