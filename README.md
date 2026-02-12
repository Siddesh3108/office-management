# OfficeWatch

Lightweight, production-oriented demo of a SaaS procurement & spend monitoring platform.

This repository contains a full-stack prototype built to demonstrate a realistic engineering approach to detecting unmanaged SaaS spending ("Shadow IT"). The codebase includes a React frontend, a FastAPI backend, Celery workers for background processing, Redis for caching and as the Celery broker, and PostgreSQL for persistence.

Why this README: concise, factual, and aligned to the code in this repo — suitable for technical reviewers and interviewers.

---

## Project snapshot

- Frontend: React (Vite) app in `frontend/` serving a dashboard and authentication UI.
- Backend: FastAPI app in `backend/app/` exposing REST endpoints and OpenAPI docs.
- Background workers: Celery workers defined in `backend/app/worker.py` and tasks in `backend/app/tasks.py`.
- Broker & cache: Redis (configured in `docker-compose.yml`).
- Database: PostgreSQL service (configured in `docker-compose.yml`).

This README focuses on how to run the project, the core technical choices, and the most important implementation details recruiters/interviewers will look for.

---

## Quick start (local, Docker)

Prerequisites: Docker and Docker Compose.

1. Clone the repo

```bash
git clone https://github.com/Siddesh3108/office-management.git
cd office-management
```

2. Build and run services

```bash
docker-compose up --build
```

Services started by default:
- Frontend: http://localhost:3000
- Backend (FastAPI + docs): http://localhost:8000/docs

3. API health check

```bash
curl http://localhost:8000/health
```

4. Running tests (inside the backend container)

```bash
docker-compose exec backend python -m pytest
```

---

## Architecture & implementation highlights

- FastAPI: asynchronous endpoints with dependency-injection patterns for auth and permissions.
- JWT-based auth: token creation and validation implemented using `python-jose` (see `backend/app/auth.py` and `backend/app/middleware.py`).
- Caching: Redis used for read-through caching in `backend/app/main.py` to reduce DB load for dashboard routes.
- Background processing: Celery workers configured in `backend/app/worker.py` and used to offload heavy tasks (example: `scan_invoice` task in `backend/app/tasks.py`).
- Data persistence: PostgreSQL configured via `docker-compose.yml` and reachable to the backend through `DATABASE_URL` env var.
- File handling: shared Docker volume `shared_data` used for temporary uploads between backend and worker.

Design choices to note (good talking points in interviews):
- Use of Celery for reliability and retries when processing large or long-running workloads.
- Cache invalidation strategy implemented at the handler level to guarantee freshness for key dashboard endpoints.
- JWT + middleware approach keeps authorization checks centralized and testable.

---

## How to run locally (dev loop)

If you prefer to run services locally without Docker:

- Create a Python venv and install `backend/requirements.txt`.
- Ensure a running Postgres instance and Redis instance and set `DATABASE_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, and `SECRET_KEY` as environment variables.
- Start the backend with Uvicorn:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Start a worker:

```bash
celery -A app.worker.celery_app worker --loglevel=info
```

---

## Files you should look at for technical review

- `backend/app/main.py` — API routes, Redis caching logic, file upload flows.
- `backend/app/auth.py` & `backend/app/middleware.py` — JWT creation and middleware enforcement.
- `backend/app/worker.py` — Celery app configuration and broker/back-end wiring.
- `backend/app/tasks.py` — Example background tasks (invoice scanning pipeline).
- `docker-compose.yml` — Local development orchestration and service wiring.

When interviewing, be prepared to explain trade-offs for each choice (e.g., Celery vs. other queue systems, Redis eviction policies, token expiry/rotation strategy).

---

## Tests & quality

- A small test suite exists under `backend/tests` using `pytest` and `fastapi.testclient`.
- Aim: unit tests for auth flows + integration smoke tests for key endpoints.

Improvements you could mention in interviews:
- Add CI (GitHub Actions) to run linting and pytest.
- Add contract tests for frontend-backend integration.

---

## Security & production notes

- Never commit secrets; the repo uses environment variables (see `docker-compose.yml`).
- In production, rotate `SECRET_KEY` regularly and use an env-secret manager (Vault, AWS Secrets Manager).
- Consider moving Redis to a managed provider and enabling TLS between services.

---

## Contact / Author

Built by Siddesh3108 — Backend / Full-Stack Engineer.

If you'd like, I can:
- Add CI with tests and coverage reporting.
- Expand the developer README with a local dev checklist.
- Create a compact one-page `HIGHLIGHTS.md` bulleting measurable project outcomes.

---

*This README was tailored to the repository contents (FastAPI backend, Celery workers, Redis, PostgreSQL, React frontend). It is structured for technical reviewers and interviewers, highlighting points you can demonstrate during FAANG-style interviews.*


