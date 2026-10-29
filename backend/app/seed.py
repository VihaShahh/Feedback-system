from datetime import UTC, date, datetime, timedelta
from uuid import NAMESPACE_DNS, uuid5

from sqlalchemy import func, select

from .models import (
    AuditEvent,
    CheckIn,
    Cycle,
    Feedback,
    FeedbackRequest,
    Goal,
    Grant,
    Notification,
    Revision,
    User,
)
from .passwords import hash_password

DEMO_PEOPLE = [
    ("maya", "Maya Chen", "manager", "Product & Engineering", "Engineering Manager", None),
    ("daniel", "Daniel Brooks", "manager", "Operations", "Operations Manager", None),
    ("priya", "Priya Shah", "senior_management", "Leadership", "VP, People & Culture", None),
    ("sam", "Sam Rivera", "admin", "People Operations", "Workspace Administrator", None),
    ("alex", "Alex Morgan", "employee", "Product & Engineering", "Product Designer", "maya"),
    ("emma", "Emma Wilson", "employee", "Product & Engineering", "Software Engineer", "maya"),
    ("noah", "Noah Williams", "employee", "Product & Engineering", "Senior Engineer", "maya"),
    ("sophia", "Sophia Patel", "employee", "Product & Engineering", "Product Manager", "maya"),
    ("olivia", "Olivia Kim", "employee", "Operations", "Operations Analyst", "daniel"),
    ("liam", "Liam Garcia", "employee", "Operations", "Customer Success", "daniel"),
]


def demo_id(key):
    return str(uuid5(NAMESPACE_DNS, "gather.feedback.demo." + key))


def seed_demo(db, password, settings):
    if settings.environment == "production":
        raise ValueError("Demo data is disabled in production")
    existing = db.scalar(select(func.count()).select_from(User))
    if existing:
        matches = db.scalar(
            select(func.count())
            .select_from(User)
            .where(User.id.in_([demo_id(x[0]) for x in DEMO_PEOPLE]))
        )
        if existing == matches == len(DEMO_PEOPLE):
            return {"users": existing, "created": False}
        raise ValueError("Demo initialization requires an empty database")
    hashed = hash_password(password)
    for key, name, role, department, title, manager in DEMO_PEOPLE:
        db.add(
            User(
                id=demo_id(key),
                name=name,
                email=f"{key}@gather.example.com",
                role=role,
                department=department,
                title=title,
                password_hash=hashed,
                manager_id=demo_id(manager) if manager else None,
            )
        )
        db.flush()
    today = date.today()
    cycle = Cycle(
        id=demo_id("cycle"),
        name="Quarterly growth conversations",
        starts_on=str(today - timedelta(days=90)),
        ends_on=str(today + timedelta(days=45)),
        state="open",
    )
    db.add(cycle)
    db.flush()
    strengths = [
        "You turn complex problems into clear, thoughtful solutions. Your collaboration on the launch helped the whole team move forward.",
        "Your ownership and attention to detail made a clear difference. You brought the right people into decisions early.",
        "You communicate your reasoning clearly and make space for different perspectives. The quality of your work continues to grow.",
    ]
    improvements = [
        "Share early work more often so the team can contribute before decisions are final.",
        "Build a habit of documenting decisions and their tradeoffs for the wider team.",
        "Protect time for focused work, and flag competing priorities earlier in the week.",
    ]
    for index, (key, _, role, _, _, manager) in enumerate(DEMO_PEOPLE):
        if role != "employee":
            continue
        for j, days in enumerate([65, 34, 6]):
            timestamp = (datetime.now(UTC) - timedelta(days=days, hours=index)).isoformat()
            sentiment = (
                "needs_attention"
                if key == "noah" and j == 2
                else "balanced"
                if (index + j) % 4 == 0
                else "positive"
            )
            row = Feedback(
                id=demo_id(f"feedback-{key}-{j}"),
                employee_id=demo_id(key),
                author_id=demo_id(manager),
                cycle_id=cycle.id,
                strengths=strengths[j],
                improvements=improvements[j],
                sentiment=sentiment,
                state="published",
                version=2,
                created_at=timestamp,
                updated_at=timestamp,
                published_at=timestamp,
                acknowledged_at=timestamp if j < 2 else None,
                acknowledged_version=2 if j < 2 else None,
            )
            db.add(row)
            db.flush()
            db.add(
                Revision(
                    feedback_id=row.id,
                    editor_id=row.author_id,
                    version=2,
                    strengths=row.strengths,
                    improvements=row.improvements,
                    sentiment=sentiment,
                    created_at=timestamp,
                )
            )
            if j == 2:
                db.add(
                    Notification(
                        user_id=row.employee_id,
                        kind="feedback.published",
                        message="You have new feedback to review",
                        resource_id=row.id,
                    )
                )
        db.add(
            Goal(
                employee_id=demo_id(key),
                creator_id=demo_id(manager),
                title="Lead a cross-team learning session",
                description="Share a recent project and invite feedback from the team.",
                due_on=str(today + timedelta(days=21)),
                progress=40,
            )
        )
    db.add(
        Goal(
            employee_id=demo_id("alex"),
            creator_id=demo_id("alex"),
            title="Build confidence in design storytelling",
            description="Practice presenting the problem, evidence and tradeoffs in weekly reviews.",
            due_on=str(today + timedelta(days=14)),
            progress=65,
        )
    )
    db.add(
        Feedback(
            employee_id=demo_id("alex"),
            author_id=demo_id("maya"),
            cycle_id=cycle.id,
            strengths="Strong discovery work on the new onboarding flow.",
            improvements="Bring an early prototype to the next team review.",
            sentiment="positive",
            state="draft",
        )
    )
    monday = today - timedelta(days=today.weekday())
    db.add(
        CheckIn(
            employee_id=demo_id("alex"),
            week_of=str(monday),
            mood="great",
            workload="balanced",
            note="Good momentum on the onboarding project.",
        )
    )
    db.add(
        FeedbackRequest(
            employee_id=demo_id("emma"),
            manager_id=demo_id("maya"),
            topic="Feedback on the release handover",
            note="I would appreciate thoughts on communication and ownership.",
        )
    )
    db.add(Grant(user_id=demo_id("maya"), permission="feedback.export"))
    db.add(
        AuditEvent(actor_id=demo_id("sam"), action="demo.initialized", resource_type="workspace")
    )
    return {"users": len(DEMO_PEOPLE), "created": True}
