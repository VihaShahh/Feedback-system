from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from ..dependencies import current_user, get_db
from ..errors import fail
from ..feedback import (
    audit,
    change_feedback,
    feedback_payload,
    find_feedback,
    notify,
    revision,
    visible_feedback,
    writable_feedback,
)
from ..feedback_schemas import (
    CommentInput,
    EscalationInput,
    FeedbackCreate,
    FeedbackEdit,
    FeedbackState,
    ResolutionInput,
    Sentiment,
)
from ..models import Comment, Feedback, Revision, User
from ..models.common import now
from ..policy import Role, manages
from ..schemas import VersionInput

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("", status_code=201)
def create_feedback(
    data: FeedbackCreate, actor: User = Depends(current_user), db: Session = Depends(get_db)
):
    target = db.get(User, data.employee_id)
    if not target or not manages(actor, target) or target.id == actor.id:
        fail(404, "Choose one of your active direct reports")
    if data.cycle_id is not None:
        from ..models import Cycle

        cycle = db.get(Cycle, data.cycle_id)
        if not cycle or cycle.state != "open":
            fail(422, "Choose an open review cycle")
    feedback = Feedback(**data.model_dump(), author_id=actor.id)
    db.add(feedback)
    db.flush()
    audit(db, actor, "feedback.drafted", feedback.id)
    return feedback_payload(db, actor, feedback)


@router.get("")
def list_feedback(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=100),
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    query = visible_feedback(actor).where(Feedback.state != "archived")
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    records = db.scalars(
        query.order_by(Feedback.updated_at.desc(), Feedback.id).offset(offset).limit(limit)
    ).all()
    return {
        "items": [feedback_payload(db, actor, record) for record in records],
        "total": total,
        "offset": offset,
        "limit": limit,
    }
