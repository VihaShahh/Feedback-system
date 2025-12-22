# Gather — employee feedback and growth

A permission-aware employee feedback workspace with employee, manager, senior-management and administrator views. It includes private drafts, published revision history, acknowledgement, conversations, escalations, review cycles, development goals, weekly check-ins, feedback requests, notifications and scoped dashboards.

| Account | Default access |
| --- | --- |
| Employee | Own published feedback, goals, check-ins, requests and notifications |
| Manager | Own records plus current direct reports and team workflows |
| Senior management | Own records, protected organization summaries and explicitly escalated feedback |
| Administrator | Own records, account and reporting-line administration, grants, cycles and audit metadata |

Explicit privileges can extend an account’s role. Administration does not automatically expose feedback content. Read the [security contract](docs/security.md) and [architecture](docs/architecture.md) for the exact boundaries.

## Local setup

Use Python 3.12 and Node.js 24. From the repository root:

```bash
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.lock
.venv/bin/pip install -e . --no-deps
cp .env.example .env
.venv/bin/alembic upgrade head
npm --prefix frontend ci
```

Choose one initialization mode for an empty database. For a real workspace, create the first administrator; the command prompts for a password without printing it:

```bash
.venv/bin/python -m backend.app.cli create-admin --email you@example.com --name "Your Name"
```

For an explicitly synthetic local demo, choose a shared demo password at the prompt:

```bash
.venv/bin/python -m backend.app.cli seed-demo
```

Synthetic accounts are `alex@gather.example.com` (employee), `maya@gather.example.com` (manager), `priya@gather.example.com` (senior management), and `sam@gather.example.com` (administrator). Use the password you supplied. Demo initialization refuses production or an unrelated non-empty database and never resets existing account passwords.

Start the API and frontend in separate terminals:

```bash
.venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000
npm --prefix frontend run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api` to the local API. `FEEDBACK_API_TARGET` can point the development proxy at another local API. Development API documentation is at `http://127.0.0.1:8000/api/docs`. Accounts and roles are provisioned through administration; there is no public signup or role selector.

## Configuration

Settings use the `FEEDBACK_` prefix and the root `.env`. `FEEDBACK_DATABASE_URL` defaults to a durable local SQLite file. PostgreSQL URLs use `postgresql+psycopg://...`. Apply Alembic migrations before starting the service; `/api/v1/ready` reports absent or outdated migrations.

Production settings require `FEEDBACK_ENVIRONMENT=production`, `FEEDBACK_SECURE_COOKIES=true`, a durable database, and explicit HTTPS origins in `FEEDBACK_ALLOWED_ORIGINS` as a JSON array. Serve the frontend and API behind the same trusted HTTPS origin, with `/api` routed to FastAPI. Take database-consistent backups and verify a restore before relying on the service. Existing MongoDB data requires a separate migration; this refactor does not read or modify a legacy database.

## Verification

```bash
.venv/bin/ruff check backend scripts
.venv/bin/pytest --cov=backend/app --cov-fail-under=80
.venv/bin/pip-audit --local --skip-editable
npm --prefix frontend run format:check
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend audit
```

For browser tests, use installed Chrome or install Playwright Chromium, then run the journeys. These start disposable servers on ports 8097 and 5179 with synthetic test data; they do not touch `feedback.db`.

```bash
cd frontend
npx playwright install chromium
npm run test:browser
```

For a PostgreSQL smoke check, create an empty disposable database, set `FEEDBACK_DATABASE_URL` to it and run `.venv/bin/python scripts/check-postgres.py`. The script refuses non-empty databases. Remove that disposable database after the check.

OpenSpec planning, environment files, local databases and generated browser artifacts remain ignored. CI covers backend regressions, PostgreSQL schema and role smoke checks, frontend validation and the browser journeys. Hosted CI results and production deployment are separate from local verification.
