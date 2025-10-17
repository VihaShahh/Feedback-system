from sqlalchemy import CheckConstraint, ForeignKey, Index, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base
from .common import Record


class FeedbackRequest(Record, Base):
    __tablename__ = "feedback_requests"
    __table_args__ = (
        Index(
            "unique_open_feedback_request",
            "employee_id",
            unique=True,
            sqlite_where=text("state = 'open'"),
            postgresql_where=text("state = 'open'"),
        ),
        CheckConstraint("state IN ('open','fulfilled','cancelled')", name="valid_request_state"),
    )
    employee_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    manager_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    topic: Mapped[str] = mapped_column(String(160))
    note: Mapped[str] = mapped_column(Text, default="")
    state: Mapped[str] = mapped_column(String(16), default="open")
    feedback_id: Mapped[str | None] = mapped_column(ForeignKey("feedback.id"))
