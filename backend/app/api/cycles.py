from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import model_validator
from sqlalchemy import select, text, update
from sqlalchemy.orm import Session

from ..dependencies import current_user, get_db, require
from ..errors import fail
from ..events import audit
from ..models import Cycle, User
from ..policy import Permission
from ..schemas import Input, Name

router = APIRouter(prefix="/cycles", tags=["Review cycles"])


class CycleCreate(Input):
    name: Name
    starts_on: date
    ends_on: date

    @model_validator(mode="after")
    def ordered_dates(self):
        if self.ends_on < self.starts_on:
            raise ValueError("End date must follow start date")
        return self


class CycleTransition(Input):
    state: Literal["open", "closed"]


@router.get("")
def cycles(actor: User = Depends(current_user), db: Session = Depends(get_db, scope="function")):
    rows = db.scalars(select(Cycle).order_by(Cycle.starts_on.desc(), Cycle.id)).all()
    return {
        "items": [
            {column.name: getattr(row, column.name) for column in Cycle.__table__.columns}
            for row in rows
        ]
    }


@router.post("", status_code=201)
def create_cycle(
    data: CycleCreate,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db, scope="function"),
):
    require(actor, Permission.CYCLES_MANAGE)
    cycle = Cycle(
        name=data.name, starts_on=data.starts_on.isoformat(), ends_on=data.ends_on.isoformat()
    )
    db.add(cycle)
    db.flush()
    audit(db, actor, "cycle.created", cycle.id, "cycle")
    return {column.name: getattr(cycle, column.name) for column in Cycle.__table__.columns}


@router.patch("/{cycle_id}")
def transition_cycle(
    cycle_id: str,
    data: CycleTransition,
    actor: User = Depends(current_user),
    db: Session = Depends(get_db, scope="function"),
):
    require(actor, Permission.CYCLES_MANAGE)
    if db.bind.dialect.name == "postgresql":
        db.execute(text("SELECT pg_advisory_xact_lock(67128202)"))
    cycle = db.scalar(select(Cycle).where(Cycle.id == cycle_id).with_for_update())
    if not cycle:
        fail(404, "Review cycle not found")
    old = cycle.state
    if (old, data.state) not in {("draft", "open"), ("open", "closed")}:
        fail(409, "Cycles move from draft to open to closed")
    if data.state == "open":
        overlapping = db.scalar(
            select(Cycle.id)
            .where(
                Cycle.id != cycle.id,
                Cycle.state == "open",
                Cycle.starts_on <= cycle.ends_on,
                Cycle.ends_on >= cycle.starts_on,
            )
            .limit(1)
        )
        if overlapping:
            fail(409, "An open cycle already overlaps these dates")
    result = db.execute(
        update(Cycle).where(Cycle.id == cycle.id, Cycle.state == old).values(state=data.state)
    )
    if result.rowcount != 1:
        fail(409, "Review cycle changed. Reload before continuing")
    db.expire(cycle)
    audit(db, actor, "cycle." + data.state, cycle.id, "cycle")
    return {column.name: getattr(cycle, column.name) for column in Cycle.__table__.columns}
