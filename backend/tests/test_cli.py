import pytest

from backend.app.cli import bootstrap_admin
from backend.app.models import User
from backend.app.passwords import verify_password


def test_admin_bootstrap_normalizes_identity_and_refuses_second_root(empty_db):
    user_id = bootstrap_admin(
        empty_db, "ROOT@example.com", "Root Person", "A long bootstrap passphrase"
    )
    user = empty_db.get(User, user_id)
    assert user.email == "root@example.com" and user.role == "admin"
    assert verify_password("A long bootstrap passphrase", user.password_hash)
    with pytest.raises(ValueError, match="already exists"):
        bootstrap_admin(empty_db, "other@example.com", "Other Person", "Another long passphrase")
