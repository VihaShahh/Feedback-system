from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import Field
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from ..dependencies import current_user, get_db
from ..errors import fail
from ..events import audit, notify
from ..models import Goal, User
from ..people import employee_record
from ..schemas import Input, VersionInput

router = APIRouter(prefix="/goals", tags=["Development goals"])


class GoalCreate(Input):
    employee_id: str | None = None
    title: str = Field(min_length=3, max_length=160)
    description: str = Field(default="", max_length=4000)
    due_on: date | None = None


class GoalUpdate(VersionInput):
    title: str | None = Field(default=None, min_length=3, max_length=160)
    description: str | None = Field(default=None, max_length=4000)
    progress: int | None = Field(default=None, ge=0, le=100)
    state: Literal["active", "completed", "cancelled"] | None = None
    due_on: date | None = None


def goal_payload(row):
    return {column.name: getattr(row, column.name) for column in Goal.__table__.columns}


@router.get("")
def goals(
    employee_id: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=100),
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    target = employee_record(db, actor, employee_id or actor.id)
    query = select(Goal).where(Goal.employee_id == target.id)
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    rows = db.scalars(
        query.order_by(Goal.created_at.desc(), Goal.id).offset(offset).limit(limit)
    ).all()
    return {"items": [goal_payload(row) for row in rows], "total": total}


@router.post("", status_code=201)
def create_goal(
    data: GoalCreate,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    target = employee_record(db, actor, data.employee_id or actor.id)
    row = Goal(
        employee_id=target.id,
        creator_id=actor.id,
        title=data.title,
        description=data.description,
        due_on=data.due_on.isoformat() if data.due_on else None,
    )
    db.add(row)
    db.flush()
    audit(db, actor, "goal.created", row.id, "goal")
    if target.id != actor.id:
        notify(db, target.id, "goal.assigned", "Your manager shared a new development goal", row.id)
    return goal_payload(row)
