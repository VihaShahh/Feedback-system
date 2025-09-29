def test_revision_history_keeps_original_content_and_newest_first(sign_in, make_feedback):
    record = make_feedback()
    path = f"/api/v1/feedback/{record['id']}"
    client = sign_in("manager")
    response = client.patch(
        path,
        json={
            "version": record["version"],
            "strengths": "A revised assessment",
            "improvements": record["improvements"],
            "sentiment": "balanced",
        },
    )
    assert response.status_code == 200
    items = sign_in("employee").get(path + "/revisions").json()["items"]
    assert [x["version"] for x in items] == [3, 2]
    assert items[1]["strengths"] == record["strengths"]
    assert items[0]["strengths"] == "A revised assessment"
    assert sign_in("other").get(path + "/revisions").status_code == 404
