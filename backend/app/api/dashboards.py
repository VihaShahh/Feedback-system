from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..analytics import monthly_trend, period_filter, summarize
from ..dependencies import current_user, get_db, require
from ..errors import fail
from ..feedback import feedback_payload
from ..models import Feedback, FeedbackRequest, Goal, User
from ..policy import Permission, Role

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])
Month = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$", min_length=7, max_length=7)


def feedback_base():
    return select(Feedback).where(Feedback.state == "published")


def sentiment_counts(stats):
    return {key: stats[key] for key in ["positive", "balanced", "needs_attention"]}


@router.get("/personal")
def personal(actor: User = Depends(current_user), db: Session = Depends(get_db)):
    query = feedback_base().where(Feedback.employee_id == actor.id)
    stats = summarize(db, query)
    goals = db.scalar(
        select(func.count())
        .select_from(Goal)
        .where(Goal.employee_id == actor.id, Goal.state == "active")
    )
    recent = db.scalars(query.order_by(Feedback.published_at.desc(), Feedback.id).limit(5)).all()
    return {
        "kind": "personal",
        "metrics": {
            "feedback_received": stats["total"],
            "pending_acknowledgements": stats["total"] - stats["acknowledged"],
            "active_goals": goals,
            "positive_percent": round(stats["positive"] * 100 / stats["total"])
            if stats["total"]
            else None,
        },
        "sentiment": sentiment_counts(stats),
        "trend": monthly_trend(db, query),
        "recent_feedback": [feedback_payload(db, actor, row) for row in recent],
    }


@router.get("/team")
def team(actor: User = Depends(current_user), db: Session = Depends(get_db)):
    if actor.role != Role.MANAGER:
        fail(403, "This dashboard is for managers")
    people = db.scalars(
        select(User).where(User.manager_id == actor.id, User.active).order_by(User.name, User.id)
    ).all()
    ids = [person.id for person in people]
    query = feedback_base().where(Feedback.employee_id.in_(ids))
    stats = summarize(db, query)
    active_goals = db.scalar(
        select(func.count())
        .select_from(Goal)
        .where(Goal.employee_id.in_(ids), Goal.state == "active")
    )
    open_requests = db.scalar(
        select(func.count())
        .select_from(FeedbackRequest)
        .where(FeedbackRequest.employee_id.in_(ids), FeedbackRequest.state == "open")
    )
    cards = []
    for person in people:
        individual = summarize(db, query.where(Feedback.employee_id == person.id))
        latest = db.scalar(
            query.where(Feedback.employee_id == person.id)
            .order_by(Feedback.published_at.desc())
            .limit(1)
        )
        cards.append(
            {
                "id": person.id,
                "name": person.name,
                "title": person.title,
                "department": person.department,
                "feedback_count": individual["total"],
                "pending": individual["total"] - individual["acknowledged"],
                "latest_sentiment": latest.sentiment if latest else None,
                "latest_feedback_at": latest.published_at if latest else None,
            }
        )
    recent = db.scalars(query.order_by(Feedback.published_at.desc(), Feedback.id).limit(5)).all()
    return {
        "kind": "team",
        "metrics": {
            "team_size": len(ids),
            "feedback_shared": stats["total"],
            "pending_acknowledgements": stats["total"] - stats["acknowledged"],
            "active_goals": active_goals,
            "needs_attention": stats["needs_attention"],
            "open_requests": open_requests,
        },
        "sentiment": sentiment_counts(stats),
        "trend": monthly_trend(db, query),
        "team": cards,
        "recent_feedback": [feedback_payload(db, actor, row) for row in recent],
    }
