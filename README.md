# Requirements Discovery & Traceability Platform

A centralized platform for legacy system modernization teams to discover, document, and track requirements with full traceability.

## Features

- **Requirements Management** — Capture requirements with rich metadata, source tracking, priority, confidence levels, and status workflow
- **Stakeholder & System Registry** — Track ownership and system associations
- **Status Workflow** — Draft → Under Review → Approved/Rejected → In Progress → Completed/Deferred
- **Evidence Attachments** — Upload files (PDF, DOCX, images, etc.) as supporting evidence
- **Requirement Relations** — Link related requirements for traceability
- **Tags** — Free-form classification labels
- **Dashboard** — Visual metrics on requirement status, priority distribution, and recent activity
- **Full-text Search & Filtering** — Find requirements by any attribute

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Python 3.11+ |
| Database | SQLite (via SQLAlchemy async) |
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| State | TanStack Query v5 |
| Forms | React Hook Form + Zod |

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
mkdir -p data uploads
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # optional, defaults work for local dev
npm run dev
```

App available at: http://localhost:5173

## Running Tests

```bash
# Backend
cd backend
source .venv/bin/activate
pytest -v

# Frontend
cd frontend
npm run build                   # TypeScript type check
```

## Security

- All inputs validated via Pydantic schemas (backend) and Zod (frontend)
- SQLAlchemy ORM prevents SQL injection
- File uploads validated by extension whitelist and size limit (25 MB)
- Path traversal prevented with `pathlib.Path.resolve()` prefix checks
- Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- Downloaded files served with `Content-Disposition: attachment`
- No hardcoded secrets — all configuration via environment variables

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=sqlite+aiosqlite:///./data/requirements.db
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=25
CORS_ORIGINS=["http://localhost:5173"]
APP_VERSION=0.1.0
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:8000/api/v1
```

## Project Structure

```
Requirement_Discovery_Tool/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, security headers
│   │   ├── config.py        # Settings from environment
│   │   ├── database.py      # Async SQLAlchemy setup
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── routers/         # FastAPI route handlers
│   │   └── services/        # Business logic layer
│   └── tests/               # pytest test suite
└── frontend/
    └── src/
        ├── api/             # Axios API client functions
        ├── hooks/           # TanStack Query hooks
        ├── components/      # React components
        ├── pages/           # Route-level page components
        ├── lib/             # Utilities and constants
        └── types/           # TypeScript type definitions
```
