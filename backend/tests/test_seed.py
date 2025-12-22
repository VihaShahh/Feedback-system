import pytest
from sqlalchemy import func, select

from backend.app.models import Feedback, User
from backend.app.seed import seed_demo
from backend.app.settings import Settings


def test_demo_seed_is_synthetic_repeatable_and_has_workflow_data(empty_db):
    settings = Settings(environment="test")
    first = seed_demo(empty_db, "Explicit demo password 42", settings)
    empty_db.flush()
    second = seed_demo(empty_db, "Ignored replacement password 43", settings)
    assert first["created"] and not second["created"] and second["users"] == 10
    assert empty_db.scalar(select(func.count()).select_from(Feedback)) == 19
    assert all(
        user.email.endswith("@gather.example.com") for user in empty_db.scalars(select(User))
    )


def test_production_demo_seed_is_rejected_before_mutation(empty_db):
    production = Settings(
        environment="production", secure_cookies=True, allowed_origins=["https://example.com"]
    )
    with pytest.raises(ValueError, match="disabled"):
        seed_demo(empty_db, "Explicit demo password 42", production)
    assert empty_db.scalar(select(func.count()).select_from(User)) == 0
