from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from ..cycles import require_open_cycle
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
    data: FeedbackCreate,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    target = db.get(User, data.employee_id)
    if not target or not manages(actor, target) or target.id == actor.id:
        fail(404, "Choose one of your active direct reports")
    if data.cycle_id is not None:
        from ..models import Cycle

        cycle = db.get(Cycle, data.cycle_id)
        if not cycle or cycle.state != "open":
            fail(422, "Choose an open review cycle")
    require_open_cycle(db, data.cycle_id)
    feedback = Feedback(**data.model_dump(), author_id=actor.id)
    db.add(feedback)
    db.flush()
    audit(db, actor, "feedback.drafted", feedback.id)
    return feedback_payload(db, actor, feedback)


@router.get("")
def list_feedback(
    state: FeedbackState | None = None,
    sentiment: Sentiment | None = None,
    employee_id: str | None = None,
    cycle_id: str | None = None,
    escalated: bool | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=100),
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    query = visible_feedback(actor)
    query = query.where(Feedback.state == state if state else Feedback.state != "archived")
    for column, value in (
        (Feedback.sentiment, sentiment),
        (Feedback.employee_id, employee_id),
        (Feedback.cycle_id, cycle_id),
        (Feedback.escalated, escalated),
    ):
        if value is not None:
            query = query.where(column == value)
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
    feedback_id: str,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
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
    if feedback.state == "archived":
        fail(409, "Archived feedback is read-only")
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
    require_open_cycle(db, feedback.cycle_id)
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


@router.post("/{feedback_id}/acknowledge")
def acknowledge_feedback(
    feedback_id: str,
    data: VersionInput,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    feedback = find_feedback(db, actor, feedback_id)
    if feedback.employee_id != actor.id:
        fail(403, "Only the recipient can acknowledge this feedback")
    if feedback.state != "published" or feedback.version != data.version:
        fail(409, "Review the current published feedback before acknowledging")
    if feedback.acknowledged_version != data.version:
        result = db.execute(
            update(Feedback)
            .where(
                Feedback.id == feedback.id,
                Feedback.version == data.version,
                Feedback.state == "published",
            )
            .values(acknowledged_at=now(), acknowledged_version=data.version)
        )
        if result.rowcount != 1:
            fail(409, "Feedback changed. Review it again")
        db.expire(feedback)
        audit(db, actor, "feedback.acknowledged", feedback.id)
        notify(
            db,
            feedback.author_id,
            "feedback.acknowledged",
            "An employee acknowledged your feedback",
            feedback.id,
        )
    return feedback_payload(db, actor, feedback)


@router.get("/{feedback_id}/revisions")
def revisions(
    feedback_id: str,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    feedback = find_feedback(db, actor, feedback_id)
    records = db.scalars(
        select(Revision)
        .where(Revision.feedback_id == feedback.id)
        .order_by(Revision.version.desc())
    ).all()
    return {
        "items": [
            {column.name: getattr(record, column.name) for column in Revision.__table__.columns}
            for record in records
        ]
    }


@router.post("/{feedback_id}/archive")
def archive_feedback(
    feedback_id: str,
    data: VersionInput,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    feedback = writable_feedback(db, actor, feedback_id)
    if feedback.state != "published":
        fail(409, "Only published feedback can be archived")
    acknowledgement = data.version + 1 if feedback.acknowledged_version == data.version else None
    change_feedback(
        db, feedback, data.version, state="archived", acknowledged_version=acknowledgement
    )
    audit(db, actor, "feedback.archived", feedback.id)
    return feedback_payload(db, actor, feedback)


@router.get("/{feedback_id}/comments")
def comments(
    feedback_id: str,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    feedback = find_feedback(db, actor, feedback_id)
    if feedback.state == "draft":
        return {"items": []}
    records = db.scalars(
        select(Comment)
        .where(Comment.feedback_id == feedback.id)
        .order_by(Comment.created_at, Comment.id)
    ).all()
    return {
        "items": [
            {
                "id": row.id,
                "author_id": row.author_id,
                "author_name": db.get(User, row.author_id).name,
                "body": row.body,
                "created_at": row.created_at,
            }
            for row in records
        ]
    }


@router.post("/{feedback_id}/comments", status_code=201)
def add_comment(
    feedback_id: str,
    data: CommentInput,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    feedback = find_feedback(db, actor, feedback_id)
    if feedback.state != "published":
        fail(409, "Comments are available on published feedback")
    row = Comment(feedback_id=feedback.id, author_id=actor.id, body=data.body)
    db.add(row)
    db.flush()
    audit(db, actor, "feedback.commented", feedback.id)
    return {
        "id": row.id,
        "body": row.body,
        "author_id": actor.id,
        "author_name": actor.name,
        "created_at": row.created_at,
    }


@router.post("/{feedback_id}/escalate")
def escalate_feedback(
    feedback_id: str,
    data: EscalationInput,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    feedback = find_feedback(db, actor, feedback_id)
    target = db.get(User, feedback.employee_id)
    if actor.id != target.id and not manages(actor, target):
        fail(403, "Only the recipient or current manager can escalate")
    if feedback.state != "published" or feedback.version != data.version or feedback.escalated:
        fail(409, "Only current, un-escalated published feedback can be escalated")
    result = db.execute(
        update(Feedback)
        .where(
            Feedback.id == feedback.id,
            Feedback.version == data.version,
            Feedback.state == "published",
            Feedback.escalated.is_(False),
        )
        .values(escalated=True, escalation_note=data.note)
    )
    if result.rowcount != 1:
        fail(409, "Feedback changed. Reload before escalating")
    db.expire(feedback)
    audit(db, actor, "feedback.escalated", feedback.id)
    return feedback_payload(db, actor, feedback)


@router.post("/{feedback_id}/resolve")
def resolve_escalation(
    feedback_id: str,
    data: ResolutionInput,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    feedback = find_feedback(db, actor, feedback_id)
    if actor.role != Role.SENIOR:
        fail(403, "Senior management reviews escalations")
    if not feedback.escalated or feedback.resolved_at:
        fail(409, "This feedback has no open escalation")
    result = db.execute(
        update(Feedback)
        .where(
            Feedback.id == feedback.id, Feedback.resolved_at.is_(None), Feedback.escalated.is_(True)
        )
        .values(resolution_note=data.note, resolved_at=now())
    )
    if result.rowcount != 1:
        fail(409, "This escalation was already resolved")
    db.expire(feedback)
    audit(db, actor, "feedback.resolved", feedback.id)
    notify(
        db,
        feedback.employee_id,
        "feedback.resolved",
        "Senior management reviewed your escalation",
        feedback.id,
    )
    return feedback_payload(db, actor, feedback)
