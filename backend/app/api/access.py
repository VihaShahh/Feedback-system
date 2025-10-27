from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..dependencies import CSRF_COOKIE, SESSION_COOKIE, capabilities, current_user, get_db
from ..errors import fail
from ..models import LoginSession, User
from ..policy import Permission, Role, has_permission

router = APIRouter(tags=["Access"])


@router.get("/access")
def access(actor: User = Depends(current_user)):
    return {
        "role": actor.role,
        "capabilities": capabilities(actor),
        "permissions": [
            permission for permission in Permission if has_permission(actor, permission)
        ],
        "roles": [
            {"value": role.value, "label": role.value.replace("_", " ").title()} for role in Role
        ],
    }


@router.get("/auth/sessions")
def sessions(
    request: Request,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db, scope="function"),
):
    rows = db.scalars(
        select(LoginSession)
        .where(LoginSession.user_id == actor.id)
        .order_by(LoginSession.created_at.desc())
    ).all()
    return {
        "items": [
            {
                "id": row.id,
                "created_at": row.created_at,
                "expires_at": row.expires_at,
                "current": row.id == request.state.login_session.id,
            }
            for row in rows
        ]
    }


@router.delete("/auth/sessions/{session_id}", status_code=204)
def revoke_session(
    session_id: str,
    request: Request,
    response: Response,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db, scope="function"),
):
    row = db.scalar(
        select(LoginSession).where(LoginSession.id == session_id, LoginSession.user_id == actor.id)
    )
    if not row:
        fail(404, "Session not found")
    db.delete(row)
    if row.id == request.state.login_session.id:
        response.delete_cookie(SESSION_COOKIE, path="/")
        response.delete_cookie(CSRF_COOKIE, path="/")
