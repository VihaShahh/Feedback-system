from fastapi import APIRouter, Depends, Query
from pydantic import Field
from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.orm import Session

from ..dependencies import current_user, get_db
from ..errors import fail
from ..events import audit, notify
from ..feedback import find_feedback
from ..models import FeedbackRequest, User
from ..policy import Role, manages
from ..schemas import Input

router = APIRouter(prefix="/requests", tags=["Feedback requests"])


class RequestCreate(Input):
    topic: str = Field(min_length=3, max_length=160)
    note: str = Field(default="", max_length=2000)


class FulfilInput(Input):
    feedback_id: str = Field(min_length=1, max_length=36)


def payload(db, row):
    return {
        **{column.name: getattr(row, column.name) for column in FeedbackRequest.__table__.columns},
        "employee_name": db.get(User, row.employee_id).name,
    }


@router.get("")
def requests(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=100),
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    query = (
        select(FeedbackRequest)
        .join(User, User.id == FeedbackRequest.employee_id)
        .where(
            or_(
                FeedbackRequest.employee_id == actor.id,
                and_(actor.role == Role.MANAGER, User.manager_id == actor.id, User.active),
            )
        )
    )
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    rows = db.scalars(
        query.order_by(FeedbackRequest.created_at.desc(), FeedbackRequest.id)
        .offset(offset)
        .limit(limit)
    ).all()
    return {"items": [payload(db, row) for row in rows], "total": total}


@router.post("", status_code=201)
def create_request(
    data: RequestCreate,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    manager = db.get(User, actor.manager_id) if actor.manager_id else None
    if not manager or not manager.active or manager.role != Role.MANAGER:
        fail(409, "A current manager must be assigned before requesting feedback")
    if db.scalar(
        select(FeedbackRequest.id).where(
            FeedbackRequest.employee_id == actor.id, FeedbackRequest.state == "open"
        )
    ):
        fail(409, "You already have an open feedback request")
    row = FeedbackRequest(
        employee_id=actor.id, manager_id=manager.id, topic=data.topic, note=data.note
    )
    db.add(row)
    db.flush()
    audit(db, actor, "request.created", row.id, "request")
    notify(db, manager.id, "feedback.requested", "A direct report requested your feedback", row.id)
    return payload(db, row)


@router.post("/{request_id}/fulfil")
def fulfil(
    request_id: str,
    data: FulfilInput,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    row = db.get(FeedbackRequest, request_id)
    target = db.get(User, row.employee_id) if row else None
    if not row or not manages(actor, target):
        fail(404, "Feedback request not found")
    feedback = find_feedback(db, actor, data.feedback_id)
    if (
        feedback.employee_id != row.employee_id
        or feedback.state != "published"
        or feedback.author_id != actor.id
    ):
        fail(422, "Choose your published feedback for this employee")
    result = db.execute(
        update(FeedbackRequest)
        .where(FeedbackRequest.id == row.id, FeedbackRequest.state == "open")
        .values(state="fulfilled", feedback_id=feedback.id, manager_id=actor.id)
    )
    if result.rowcount != 1:
        fail(409, "This request is already closed")
    db.expire(row)
    audit(db, actor, "request.fulfilled", row.id, "request")
    notify(
        db, row.employee_id, "request.fulfilled", "Your requested feedback is ready", feedback.id
    )
    return payload(db, row)


@router.post("/{request_id}/cancel", status_code=204)
def cancel(
    request_id: str,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    result = db.execute(
        update(FeedbackRequest)
        .where(
            FeedbackRequest.id == request_id,
            FeedbackRequest.employee_id == actor.id,
            FeedbackRequest.state == "open",
        )
        .values(state="cancelled")
    )
    if result.rowcount != 1:
        fail(404, "Open feedback request not found")
    audit(db, actor, "request.cancelled", request_id, "request")
