from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..dependencies import current_user, get_db, require
from ..errors import fail
from ..models import AuditEvent, Notification, User
from ..models.common import now
from ..policy import Permission

router = APIRouter(tags=["Activity"])


@router.get("/audit")
def audit_events(
    action: str | None = Query(default=None, max_length=80),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=100),
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    require(actor, Permission.AUDIT_READ)
    query = select(AuditEvent)
    if action:
        query = query.where(AuditEvent.action == action)
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    rows = db.scalars(
        query.order_by(AuditEvent.created_at.desc(), AuditEvent.id).offset(offset).limit(limit)
    ).all()
    return {
        "items": [
            {column.name: getattr(row, column.name) for column in AuditEvent.__table__.columns}
            for row in rows
        ],
        "total": total,
    }


@router.get("/notifications")
def notifications(
    unread_only: bool = False,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=100),
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    query = select(Notification).where(Notification.user_id == actor.id)
    unread = db.scalar(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == actor.id, Notification.read_at.is_(None))
    )
    if unread_only:
        query = query.where(Notification.read_at.is_(None))
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    rows = db.scalars(
        query.order_by(Notification.created_at.desc(), Notification.id).offset(offset).limit(limit)
    ).all()
    return {
        "items": [
            {column.name: getattr(row, column.name) for column in Notification.__table__.columns}
            for row in rows
        ],
        "total": total,
        "unread": unread,
    }


@router.post("/notifications/{notification_id}/read", status_code=204)
def read_notification(
    notification_id: str,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    row = db.scalar(
        select(Notification).where(
            Notification.id == notification_id, Notification.user_id == actor.id
        )
    )
    if row is None:
        fail(404, "Notification not found")
    if not row.read_at:
        row.read_at = now()
