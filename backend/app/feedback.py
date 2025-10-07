from sqlalchemy import and_, or_, select, update

from .errors import fail
from .events import audit  # noqa: F401
from .models import Feedback, Notification, Revision, User
from .models.common import now
from .policy import Permission, Role, can_write_feedback, has_permission, manages


def visible_feedback(actor):
    team = and_(User.manager_id == actor.id, User.active, actor.role == Role.MANAGER)
    published_audience = or_(
        Feedback.employee_id == actor.id,
        team,
        has_permission(actor, Permission.FEEDBACK_ORGANIZATION),
        and_(actor.role == Role.SENIOR, Feedback.escalated),
    )
    draft_audience = and_(Feedback.author_id == actor.id, team)
    return (
        select(Feedback)
        .join(User, User.id == Feedback.employee_id)
        .where(
            or_(
                and_(Feedback.state == "draft", draft_audience),
                and_(Feedback.state != "draft", published_audience),
            )
        )
    )


def find_feedback(db, actor, feedback_id):
    feedback = db.scalar(visible_feedback(actor).where(Feedback.id == feedback_id))
    if feedback is None:
        fail(404, "Feedback not found")
    return feedback


def writable_feedback(db, actor, feedback_id):
    feedback = find_feedback(db, actor, feedback_id)
    target = db.get(User, feedback.employee_id)
    if not can_write_feedback(actor, feedback, target):
        fail(403, "Only its author and current manager can change this feedback")
    return feedback


def change_feedback(db, feedback, expected_version, **values):
    result = db.execute(
        update(Feedback)
        .where(Feedback.id == feedback.id, Feedback.version == expected_version)
        .values(**values, version=expected_version + 1, updated_at=now())
    )
    if result.rowcount != 1:
        fail(409, "Feedback changed since you opened it. Reload to review the latest version")
    db.expire(feedback)
    return feedback


def revision(db, feedback, actor):
    db.add(
        Revision(
            feedback_id=feedback.id,
            editor_id=actor.id,
            version=feedback.version,
            strengths=feedback.strengths,
            improvements=feedback.improvements,
            sentiment=feedback.sentiment,
        )
    )


def notify(db, user_id, kind, message, resource_id):
    db.add(Notification(user_id=user_id, kind=kind, message=message, resource_id=resource_id))


def feedback_payload(db, actor, feedback):
    target = db.get(User, feedback.employee_id)
    author = db.get(User, feedback.author_id)
    editable = can_write_feedback(actor, feedback, target) and feedback.state != "archived"
    data = {column.name: getattr(feedback, column.name) for column in Feedback.__table__.columns}
    data.update(
        employee_name=target.name,
        author_name=author.name,
        capabilities={
            "edit": editable,
            "publish": editable and feedback.state == "draft",
            "archive": editable and feedback.state == "published",
            "acknowledge": actor.id == feedback.employee_id
            and feedback.state == "published"
            and feedback.acknowledged_version != feedback.version,
            "comment": feedback.state == "published",
            "escalate": feedback.state == "published"
            and not feedback.escalated
            and (actor.id == feedback.employee_id or manages(actor, target)),
            "resolve": actor.role == Role.SENIOR
            and feedback.escalated
            and not feedback.resolved_at,
        },
    )
    return data
