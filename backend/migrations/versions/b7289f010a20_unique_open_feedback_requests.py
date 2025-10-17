"""Enforce one outstanding request per employee under concurrent submissions."""

import sqlalchemy as sa
from alembic import op

revision = "b7289f010a20"
down_revision = "99503a6f873b"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        "unique_open_feedback_request",
        "feedback_requests",
        ["employee_id"],
        unique=True,
        sqlite_where=sa.text("state = 'open'"),
        postgresql_where=sa.text("state = 'open'"),
    )


def downgrade():
    op.drop_index("unique_open_feedback_request", table_name="feedback_requests")
