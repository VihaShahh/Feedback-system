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
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
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
