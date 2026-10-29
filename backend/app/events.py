from .models import AuditEvent


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
