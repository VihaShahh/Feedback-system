import csv
import io

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from ..analytics import period_filter
from ..dependencies import current_user, get_db, require
from ..errors import fail
from ..events import audit
from ..feedback import visible_feedback
from ..models import Feedback, User
from ..policy import Permission

router = APIRouter(prefix="/reports", tags=["Reports"])


def csv_cell(value):
    text = str(value or "")
    if text.lstrip().startswith(("=", "+", "-", "@")) or text.startswith(("\t", "\r", "\n")):
        return "'" + text
    return text


@router.get("/feedback.csv")
def export_feedback(
    month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    cycle_id: str | None = None,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db, scope="function"),
):
    require(actor, Permission.FEEDBACK_EXPORT)
    query = period_filter(visible_feedback(actor).where(Feedback.state != "draft"), month, cycle_id)
    rows = db.scalars(query.order_by(Feedback.published_at, Feedback.id).limit(10001)).all()
    if len(rows) > 10000:
        fail(413, "Narrow the period before exporting more than 10,000 records")
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(
        ["Employee", "Author", "Strengths", "Areas to develop", "Sentiment", "Published"]
    )
    for row in rows:
        writer.writerow(
            [
                csv_cell(value)
                for value in [
                    db.get(User, row.employee_id).name,
                    db.get(User, row.author_id).name,
                    row.strengths,
                    row.improvements,
                    row.sentiment,
                    row.published_at,
                ]
            ]
        )
    audit(db, actor, "feedback.exported", actor.id, "report")
    return Response(
        output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="feedback.csv"'},
    )
