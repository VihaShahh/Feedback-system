def test_manager_employee_and_senior_review_journey(sign_in, make_feedback):
    record = make_feedback()
    path = f"/api/v1/feedback/{record['id']}"
    employee = sign_in("employee")
    assert employee.post(path + "/acknowledge", json={"version": 2}).status_code == 200
    assert (
        employee.post(
            path + "/escalate", json={"version": 2, "note": "Please help align growth priorities"}
        ).status_code
        == 200
    )
    senior = sign_in("senior")
    assert senior.get("/api/v1/dashboards/organization").status_code == 200
    assert (
        senior.post(
            path + "/resolve", json={"note": "Agreed shared milestones with the team"}
        ).status_code
        == 200
    )
    employee = sign_in("employee")
    assert employee.get(path).json()["resolution_note"].startswith("Agreed")
    assert employee.get("/api/v1/notifications").json()["unread"] == 2
