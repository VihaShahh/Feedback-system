import argparse
import getpass
import os
import sys

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from .database import make_engine, session_factory
from .models import AuditEvent, User
from .passwords import hash_password, validate_password
from .seed import seed_demo
from .settings import Settings


def bootstrap_admin(db, email, name, password):
    from pydantic import EmailStr, TypeAdapter

    email = str(TypeAdapter(EmailStr).validate_python(email)).lower()
    if db.scalar(select(User.id).where(User.role == "admin", User.active)):
        raise ValueError("An active administrator already exists; use workspace administration")
    if db.scalar(select(User.id).where(User.email == email)):
        raise ValueError("This email already belongs to an account")
    if not name.strip() or len(name.strip()) > 120:
        raise ValueError("Provide an administrator name of up to 120 characters")
    user = User(
        name=name.strip(),
        email=email,
        password_hash=hash_password(password),
        role="admin",
        department="People Operations",
    )
    db.add(user)
    db.flush()
    db.add(
        AuditEvent(
            actor_id=user.id,
            action="administrator.bootstrapped",
            resource_type="user",
            resource_id=user.id,
        )
    )
    return user.id


def main():
    parser = argparse.ArgumentParser(
        description="Initialize an explicitly migrated feedback database"
    )
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("seed-demo", help="Create synthetic local demo data in an empty database")
    admin = sub.add_parser("create-admin", help="Create the first administrator")
    admin.add_argument("--email", required=True)
    admin.add_argument("--name", required=True)
    args = parser.parse_args()
    password = os.getenv("FEEDBACK_BOOTSTRAP_PASSWORD")
    if password is None:
        if not sys.stdin.isatty():
            parser.error("Set FEEDBACK_BOOTSTRAP_PASSWORD or run interactively")
        password = getpass.getpass("Initial password (12+ characters): ")
    try:
        validate_password(password)
        settings = Settings()
        engine = make_engine(settings.database_url)
        try:
            with session_factory(engine).begin() as db:
                if args.command == "seed-demo":
                    result = seed_demo(db, password, settings)
                    print(
                        f"Synthetic demo ready: {result['users']} accounts. Passwords were not printed."
                    )
                else:
                    bootstrap_admin(db, args.email, args.name, password)
                    print("Administrator created")
        finally:
            engine.dispose()
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except SQLAlchemyError:
        print(
            "Database initialization failed. Check the connection and apply migrations first.",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
