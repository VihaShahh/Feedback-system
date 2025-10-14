from datetime import date, timedelta


def test_cycles_require_ordered_dates_and_allow_only_forward_transitions(sign_in):
    client = sign_in("admin")
    today = date.today()
    data = {
        "name": "Quarterly development",
        "starts_on": str(today - timedelta(days=10)),
        "ends_on": str(today + timedelta(days=30)),
    }
    assert (
        client.post(
            "/api/v1/cycles", json=data | {"starts_on": str(today + timedelta(days=90))}
        ).status_code
        == 422
    )
    first = client.post("/api/v1/cycles", json=data).json()
    second = client.post("/api/v1/cycles", json=data | {"name": "Overlapping"}).json()
    assert client.patch(f"/api/v1/cycles/{first['id']}", json={"state": "open"}).status_code == 200
    assert client.patch(f"/api/v1/cycles/{second['id']}", json={"state": "open"}).status_code == 409
    assert (
        client.patch(f"/api/v1/cycles/{first['id']}", json={"state": "closed"}).status_code == 200
    )
    assert client.patch(f"/api/v1/cycles/{first['id']}", json={"state": "open"}).status_code == 409
