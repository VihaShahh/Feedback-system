from .conftest import PASSWORD


def test_password_change_revokes_current_session(sign_in):
    client = sign_in("employee")
    assert (
        client.post(
            "/api/v1/auth/password",
            json={"current_password": PASSWORD, "new_password": "Updated workplace password 43"},
        ).status_code
        == 204
    )
    assert client.get("/api/v1/auth/me").status_code == 401


def test_password_schemas_preserve_intentional_boundary_spaces():
    from backend.app.api.people import PersonCreate
    from backend.app.schemas import Login, PasswordChange

    password = "  Intentional password spaces 42  "
    assert Login(email="employee@example.com", password=password).password == password
    assert PasswordChange(current_password=password, new_password=password).new_password == password
    assert (
        PersonCreate(name="Person", email="person@example.com", password=password).password
        == password
    )
