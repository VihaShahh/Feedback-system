def test_goals_are_private_to_employee_and_current_manager(sign_in):
    own = sign_in("employee").post("/api/v1/goals", json={"title": "Improve system design"})
    assert own.status_code == 201
    assert sign_in("manager").get("/api/v1/goals?employee_id=employee").json()["total"] == 1
    assert (
        sign_in("manager")
        .post("/api/v1/goals", json={"title": "Lead a design review", "employee_id": "employee"})
        .status_code
        == 201
    )
    for role in ["other", "peer", "senior", "admin"]:
        client = sign_in(role)
        assert client.get("/api/v1/goals?employee_id=employee").status_code == 404
        assert (
            client.patch(
                f"/api/v1/goals/{own.json()['id']}", json={"version": 1, "progress": 50}
            ).status_code
            == 404
        )
