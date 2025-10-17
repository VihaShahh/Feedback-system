from datetime import date, timedelta


def test_checkin_response_requires_current_manager_and_transfers_scope(sign_in):
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    row = (
        sign_in("employee")
        .post(
            "/api/v1/checkins",
            json={"week_of": str(monday), "mood": "struggling", "workload": "heavy"},
        )
        .json()
    )
    for role in ["senior", "admin", "other", "peer"]:
        assert sign_in(role).get("/api/v1/checkins?employee_id=employee").status_code == 404
    assert (
        sign_in("employee")
        .post(f"/api/v1/checkins/{row['id']}/response", json={"response": "Respond myself"})
        .status_code
        == 403
    )
    assert (
        sign_in("admin").patch("/api/v1/people/employee", json={"manager_id": "other"}).status_code
        == 200
    )
    assert sign_in("manager").get("/api/v1/checkins?employee_id=employee").status_code == 404
    client = sign_in("other")
    assert (
        client.post(
            f"/api/v1/checkins/{row['id']}/response",
            json={"response": "Let us rebalance priorities"},
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"/api/v1/checkins/{row['id']}/response", json={"response": "A duplicate response"}
        ).status_code
        == 409
    )
