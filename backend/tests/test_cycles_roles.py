def test_cycle_creation_is_privileged_but_catalog_is_available_to_employees(sign_in):
    body = {"name": "Future cycle", "starts_on": "2027-01-01", "ends_on": "2027-03-31"}
    for role in ["employee", "manager", "senior"]:
        client = sign_in(role)
        assert client.post("/api/v1/cycles", json=body).status_code == 403
        assert client.get("/api/v1/cycles").status_code == 200
    assert sign_in("admin").post("/api/v1/cycles", json=body).status_code == 201
