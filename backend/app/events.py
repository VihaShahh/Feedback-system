from .models import AuditEvent, Notification


def audit(db, actor, action: str, resource_id: str, resource_type: str = "feedback"):
    """Accept identifiers and fixed action names only; never accept narrative metadata."""
    db.add(
        AuditEvent(
            actor_id=actor.id if actor else None,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
        )
    )


def notify(db, user_id: str, kind: str, message: str, resource_id: str | None = None):
    db.add(Notification(user_id=user_id, kind=kind, message=message, resource_id=resource_id))
