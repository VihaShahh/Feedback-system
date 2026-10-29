from datetime import date

from sqlalchemy import case, distinct, func, select

from .errors import fail
from .models import Feedback


def period_filter(query, month=None, cycle_id=None):
    if month:
        try:
            start = date.fromisoformat(month + "-01")
            if not 1900 <= start.year <= 9998:
                raise ValueError("Unsupported year")
        except ValueError:
            fail(422, "Choose a valid month between 1900 and 9998")
        end = date(start.year + (start.month == 12), start.month % 12 + 1, 1)
        query = query.where(
            Feedback.published_at >= start.isoformat(), Feedback.published_at < end.isoformat()
        )
    if cycle_id:
        query = query.where(Feedback.cycle_id == cycle_id)
    return query


def summarize(db, query):
    records = query.subquery()
    c = records.c
    row = (
        db.execute(
            select(
                func.count().label("total"),
                func.coalesce(func.sum(case((c.sentiment == "positive", 1), else_=0)), 0).label(
                    "positive"
                ),
                func.coalesce(func.sum(case((c.sentiment == "balanced", 1), else_=0)), 0).label(
                    "balanced"
                ),
                func.coalesce(
                    func.sum(case((c.sentiment == "needs_attention", 1), else_=0)), 0
                ).label("needs_attention"),
                func.coalesce(
                    func.sum(case((c.acknowledged_version == c.version, 1), else_=0)), 0
                ).label("acknowledged"),
                func.count(distinct(c.employee_id)).label("participants"),
            ).select_from(records)
        )
        .mappings()
        .one()
    )
    return dict(row)


def monthly_trend(db, query):
    records = query.subquery()
    month = func.substr(records.c.published_at, 1, 7)
    rows = (
        db.execute(
            select(month.label("month"), func.count().label("count"))
            .select_from(records)
            .group_by(month)
            .order_by(month.desc())
            .limit(12)
        )
        .mappings()
        .all()
    )
    return [dict(row) for row in reversed(rows)]
