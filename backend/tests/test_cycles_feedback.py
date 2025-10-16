from datetime import date, timedelta


def test_closed_cycle_blocks_publication_of_existing_draft(sign_in, make_feedback):
    client = sign_in("admin")
    today = date.today()
    cycle = client.post(
        "/api/v1/cycles",
        json={
            "name": "Current review",
            "starts_on": str(today - timedelta(days=1)),
            "ends_on": str(today + timedelta(days=30)),
        },
    ).json()
    assert client.patch(f"/api/v1/cycles/{cycle['id']}", json={"state": "open"}).status_code == 200
    draft = make_feedback(publish=False, cycle_id=cycle["id"])
    assert (
        sign_in("admin")
        .patch(f"/api/v1/cycles/{cycle['id']}", json={"state": "closed"})
        .status_code
        == 200
    )
    assert (
        sign_in("manager")
        .post(f"/api/v1/feedback/{draft['id']}/publish", json={"version": draft["version"]})
        .status_code
        == 409
    )
