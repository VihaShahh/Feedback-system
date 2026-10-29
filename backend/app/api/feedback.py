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


@router.get("/{feedback_id}")
def get_feedback(
    feedback_id: str, actor: User = Depends(current_user), db: Session = Depends(get_db)
):
    return feedback_payload(db, actor, find_feedback(db, actor, feedback_id))


@router.patch("/{feedback_id}")
def edit_feedback(
    feedback_id: str,
    data: FeedbackEdit,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    feedback = writable_feedback(db, actor, feedback_id)
    if feedback.state != "draft":
        fail(409, "Only drafts can be edited")
    values = data.model_dump(exclude={"version"})
    change_feedback(
        db, feedback, data.version, **values, acknowledged_at=None, acknowledged_version=None
    )
    if feedback.state == "published":
        revision(db, feedback, actor)
        notify(
            db,
            feedback.employee_id,
            "feedback.revised",
            "Your feedback has been updated",
            feedback.id,
        )
    audit(db, actor, "feedback.edited", feedback.id)
    return feedback_payload(db, actor, feedback)


@router.post("/{feedback_id}/publish")
def publish_feedback(
    feedback_id: str,
    data: VersionInput,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    feedback = writable_feedback(db, actor, feedback_id)
    if feedback.state != "draft":
        fail(409, "Only a draft can be published")
    change_feedback(db, feedback, data.version, state="published", published_at=now())
    revision(db, feedback, actor)
    notify(
        db,
        feedback.employee_id,
        "feedback.published",
        "You have new feedback to review",
        feedback.id,
    )
    audit(db, actor, "feedback.published", feedback.id)
    return feedback_payload(db, actor, feedback)
