def test_comments_share_published_audience_and_validate_bounds(sign_in, make_feedback):
    record = make_feedback()
    path = f"/api/v1/feedback/{record['id']}/comments"
    assert sign_in("other").post(path, json={"body": "private attempt"}).status_code == 404
    client = sign_in("employee")
    for body in [" ", "x" * 2001]:
        assert client.post(path, json={"body": body}).status_code == 422
    assert (
        client.post(path, json={"body": "Thank you, I will share weekly updates"}).status_code
        == 201
    )
    assert sign_in("manager").get(path).json()["items"][0]["author_id"] == "employee"
