from datetime import date, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import Field, field_validator
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from ..dependencies import current_user, get_db
from ..errors import fail
from ..events import audit, notify
from ..models import CheckIn, User
from ..people import employee_record
from ..policy import manages
from ..schemas import Input

router = APIRouter(prefix="/checkins", tags=["Weekly check-ins"])


class CheckInCreate(Input):
    week_of: date
    mood: Literal["great", "okay", "struggling"]
    workload: Literal["light", "balanced", "heavy"]
    note: str = Field(default="", max_length=2000)

    @field_validator("week_of")
    @classmethod
    def valid_week(cls, value):
        if value.weekday() != 0 or not date.today() - timedelta(days=365) <= value <= date.today():
            raise ValueError("Choose a Monday within the past year")
        return value


class CheckInResponse(Input):
    response: str = Field(min_length=3, max_length=2000)


def payload(row):
    return {column.name: getattr(row, column.name) for column in CheckIn.__table__.columns}


@router.get("")
def checkins(
    employee_id: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=100),
    actor: User = Depends(current_user),
    db: Session = Depends(get_db, scope="function"),
):
    target = employee_record(db, actor, employee_id or actor.id)
    query = select(CheckIn).where(CheckIn.employee_id == target.id)
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    rows = db.scalars(query.order_by(CheckIn.week_of.desc()).offset(offset).limit(limit)).all()
    return {"items": [payload(row) for row in rows], "total": total}


@router.post("", status_code=201)
def create_checkin(
    data: CheckInCreate,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db, scope="function"),
):
    week = data.week_of.isoformat()
    if db.scalar(
        select(CheckIn.id).where(CheckIn.employee_id == actor.id, CheckIn.week_of == week)
    ):
        fail(409, "You already submitted a check-in for this week")
    row = CheckIn(
        employee_id=actor.id, week_of=week, mood=data.mood, workload=data.workload, note=data.note
    )
    db.add(row)
    db.flush()
    audit(db, actor, "checkin.created", row.id, "checkin")
    return payload(row)


@router.post("/{checkin_id}/response")
def respond(
    checkin_id: str,
    data: CheckInResponse,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db, scope="function"),
):
    row = db.get(CheckIn, checkin_id)
    if row is None:
        fail(404, "Check-in not found")
    target = employee_record(db, actor, row.employee_id)
    if not manages(actor, target):
        fail(403, "Only your current manager can respond")
    result = db.execute(
        update(CheckIn)
        .where(CheckIn.id == row.id, CheckIn.response.is_(None))
        .values(response=data.response, responder_id=actor.id)
    )
    if result.rowcount != 1:
        fail(409, "This check-in already has a response")
    db.expire(row)
    audit(db, actor, "checkin.responded", row.id, "checkin")
    notify(
        db, row.employee_id, "checkin.responded", "Your manager responded to your check-in", row.id
    )
    return payload(row)
