from datetime import date, timedelta


def test_weekly_checkin_has_owner_and_unique_monday(sign_in):
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    client = sign_in("employee")
    body = {
        "week_of": str(monday),
        "mood": "okay",
        "workload": "heavy",
        "note": "Need help with priorities",
    }
    row = client.post("/api/v1/checkins", json=body)
    assert row.status_code == 201 and row.json()["employee_id"] == "employee"
    assert client.post("/api/v1/checkins", json=body).status_code == 409
    assert (
        client.post(
            "/api/v1/checkins", json=body | {"week_of": str(monday + timedelta(days=1))}
        ).status_code
        == 422
    )
    assert client.post("/api/v1/checkins", json=body | {"employee_id": "peer"}).status_code == 422
    assert (
        client.post(
            "/api/v1/checkins", json=body | {"week_of": str(monday + timedelta(days=7))}
        ).status_code
        == 422
    )
