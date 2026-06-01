# Requirements Discovery & Traceability Platform

A centralized web application for legacy system modernization teams to **discover, document, and track requirements** with full traceability across the modernization lifecycle.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Status Workflow](#status-workflow)
- [API Reference](#api-reference)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

> **v2** adds JWT authentication with role-based access control and CSV export. See [Authentication](#authentication) for first-time setup.

---

## Overview

Modern organizations inheriting legacy systems frequently face the same challenge: the system works, but **no one fully understands why**. Documentation is missing, business logic lives only in people's heads, and modernization projects break undocumented functionality.

This platform provides a structured, searchable, relationship-centric workspace where teams can:

- Capture requirements as they are discovered (not just at project kickoff)
- Record the *source* of each requirement — who told you, what code you read, what incident you investigated
- Track confidence levels and assumptions alongside formal requirements
- Move requirements through a governed approval workflow
- Attach evidence files (meeting notes, screenshots, log excerpts, architecture diagrams)
- Link requirements to one another for impact analysis and traceability
- Monitor modernization progress through a live dashboard

The goal is **operational utility**, not compliance paperwork. Every field serves a purpose. Every relationship enables better decision-making.

---

## Problem Statement

Legacy modernization efforts commonly fail or stall because of:

| Problem | Impact |
|---|---|
| Requirements discovered mid-project | Scope creep, missed deadlines |
| Business logic undocumented | Accidental regression during rewrite |
| Knowledge locked in individuals | Risk when SMEs leave or are unavailable |
| Assumptions never written down | Rework when assumptions prove wrong |
| No traceability to tests | Cannot verify modernization completeness |
| Decisions not recorded | Future teams repeat past mistakes |

This platform directly addresses each of these through structured capture, workflow, and search.

---

## Key Features

### Requirements Management
- Auto-generated sequential IDs (`REQ-001`, `REQ-002`, ...)
- Rich metadata: title, description, source, stakeholder, system, priority, confidence level, business impact, technical impact, notes, and tags
- Full-text search across title, description, and ID
- Multi-field filtering: status, priority, source, system, stakeholder, confidence, tags
- Sortable list view with pagination

### Requirement Source Tracking
Every requirement records *how it was discovered*:

| Source | Description |
|---|---|
| SME Interview | Captured from a subject matter expert conversation |
| Existing Documentation | Found in existing specs, runbooks, or wikis |
| Production Observation | Observed in a running production system |
| Legacy Code Analysis | Reverse-engineered from source code |
| Operational Workflow | Discovered through process observation |
| Incident Investigation | Surfaced during incident post-mortem |
| User Request | Requested by an end user or operator |
| Assumption | Not verified — recorded explicitly as an assumption |
| Reverse Engineering | Derived from system artifacts (schemas, logs, APIs) |

### Status Workflow
Requirements move through a governed lifecycle with enforced transitions (see [Status Workflow](#status-workflow)).

### Evidence Attachments
Upload supporting files directly to a requirement:
- PDFs, Word documents, Excel files
- Images (PNG, JPG)
- Plain text, CSV, Markdown files
- 25 MB limit per file, 20 files per requirement
- Files download with the original filename, served with safe headers

### Requirement Relations
Link requirements to one another to capture traceability and dependency relationships. Relations are bidirectional — linking `REQ-001 → REQ-007` automatically makes both aware of the connection.

### Stakeholder & System Registry
- Maintain a reusable directory of stakeholders (name, email, role, department)
- Maintain a registry of systems (name, description, system type)
- Both are referenced from requirements and protected from accidental deletion if in use

### Authentication & Role-Based Access
JWT-based authentication with two roles:

| Role | Permissions |
|---|---|
| **Admin** | Full access to all features + user management (list users, change roles, deactivate accounts) |
| **Analyst** | Full CRUD on all requirements, stakeholders, systems, evidence, and tags |

The first user to register is automatically assigned the Admin role. All subsequent registrations default to Analyst. Registration is self-service — no invite required.

### CSV Export
Download the current filtered requirements list as a CSV file directly from the requirements page. The export respects all active filters (status, priority, source, search query) and includes all metadata columns.

### Tags
Free-form labels for cross-cutting concerns. Tags are normalized to lowercase and auto-created on requirement save. Useful for grouping by domain (`auth`, `billing`), risk level (`high-risk`), or modernization phase (`phase-1`).

### Dashboard
Live overview of the requirements registry:
- Total requirements count
- Requirements by status (bar chart)
- Requirements by priority (bar chart)
- Recent requirements activity

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend API | FastAPI 0.111 | Async REST API framework |
| Database | SQLite + SQLAlchemy 2.0 async | Zero-config relational database |
| Migrations | Alembic | Schema version control |
| Validation | Pydantic v2 | Request/response schemas |
| Auth — JWT | python-jose + passlib[bcrypt] | Token signing and password hashing |
| Frontend | React 19 + TypeScript | UI framework |
| Build | Vite 8 | Frontend build tool |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| Server State | TanStack Query v5 | Data fetching, caching, mutations |
| Forms | React Hook Form + Zod | Type-safe form management |
| Charts | Recharts | Dashboard visualizations |
| Icons | Lucide React | Icon library |

---

## Quick Start

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- npm 9 or higher

### 1. Clone the repository

```bash
git clone <repo-url>
cd Requirement_Discovery_Tool
```

### 2. Start the Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # macOS/Linux
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements-dev.txt

# Create required directories
mkdir -p data uploads

# Start the development server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive API docs (Swagger UI) are at `http://localhost:8000/docs`.

### 3. Start the Frontend

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173`.

> The Vite dev server proxies all `/api` requests to `http://localhost:8000`, so no CORS configuration is needed during development.

### 4. First-Time Login

On first load you'll be redirected to `/register`. The first account created is automatically the **Admin**. Subsequent registrations default to **Analyst**.

After registering, you'll be logged in automatically and redirected to the dashboard. Use the sidebar's **Users** link (admin only) to manage team access.

---

## Project Structure

```
Requirement_Discovery_Tool/
│
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS middleware, security headers
│   │   ├── config.py                # Settings loaded from environment variables
│   │   ├── database.py              # Async SQLAlchemy engine, session factory, Base
│   │   │
│   │   ├── auth/                    # JWT authentication
│   │   │   ├── utils.py             # hash_password, verify_password, create_access_token
│   │   │   ├── dependencies.py      # get_current_user, require_admin FastAPI dependencies
│   │   │   └── schemas.py           # RegisterRequest, LoginRequest, TokenResponse, UserResponse
│   │   │
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   │   ├── user.py              # User model (id, email, full_name, role, is_active)
│   │   │   ├── requirement.py       # Central Requirement model
│   │   │   ├── stakeholder.py
│   │   │   ├── system.py
│   │   │   ├── tag.py
│   │   │   ├── evidence.py
│   │   │   └── associations.py      # Junction tables (requirement_tags, requirement_relations)
│   │   │
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   │   ├── common.py            # Enums, PaginatedResponse, VALID_TRANSITIONS
│   │   │   ├── requirement.py
│   │   │   ├── stakeholder.py
│   │   │   ├── system.py
│   │   │   ├── tag.py
│   │   │   └── evidence.py
│   │   │
│   │   ├── routers/                 # FastAPI route handlers
│   │   │   ├── auth.py              # /api/v1/auth — register, login, me (public)
│   │   │   ├── users.py             # /api/v1/users — admin-only user management
│   │   │   ├── requirements.py      # /api/v1/requirements + /export
│   │   │   ├── stakeholders.py      # /api/v1/stakeholders
│   │   │   ├── systems.py           # /api/v1/systems
│   │   │   ├── tags.py              # /api/v1/tags
│   │   │   ├── evidence.py          # /api/v1/requirements/{id}/evidence
│   │   │   └── dashboard.py         # /api/v1/dashboard/stats
│   │   │
│   │   └── services/                # Business logic layer
│   │       ├── requirement_service.py  # ID generation, filtering, status transitions
│   │       └── evidence_service.py     # File storage, validation, path safety
│   │
│   ├── tests/
│   │   ├── conftest.py              # In-memory test DB, async client, auth bypass fixture
│   │   ├── test_requirements.py     # Requirements CRUD, workflow, search
│   │   ├── test_stakeholders.py
│   │   ├── test_systems.py
│   │   ├── test_tags.py
│   │   ├── test_evidence.py
│   │   └── test_dashboard.py        # 50 tests total
│   │
│   ├── data/                        # SQLite database (gitignored)
│   ├── uploads/                     # Evidence file storage (gitignored)
│   ├── requirements.txt             # Production dependencies
│   └── requirements-dev.txt         # Development + test dependencies
│
└── frontend/
    └── src/
        ├── App.tsx                  # React Router route definitions, ProtectedRoute
        ├── main.tsx                 # App entry point, AuthProvider, QueryClientProvider
        │
        ├── context/
        │   └── AuthContext.tsx      # JWT token + user state, login/register/logout
        │
        ├── api/                     # Axios API client functions (typed)
        │   ├── client.ts            # Axios instance, Bearer token interceptor, 401 handler
        │   ├── requirements.ts
        │   ├── stakeholders.ts
        │   ├── systems.ts
        │   └── dashboard.ts
        │
        ├── hooks/                   # TanStack Query data hooks
        │   ├── useRequirements.ts   # List, get, create, update, delete, transition, relate
        │   ├── useStakeholders.ts
        │   ├── useSystems.ts
        │   └── useDashboard.ts
        │
        ├── pages/                   # Route-level components
        │   ├── LoginPage.tsx        # Public — email/password login form
        │   ├── RegisterPage.tsx     # Public — name/email/password registration form
        │   ├── UsersPage.tsx        # Admin only — user list, role toggle, deactivate
        │   ├── DashboardPage.tsx
        │   ├── RequirementsListPage.tsx  # Includes Export CSV button
        │   ├── RequirementDetailPage.tsx
        │   ├── RequirementFormPage.tsx   # Handles both create and edit
        │   ├── StakeholdersPage.tsx
        │   └── SystemsPage.tsx
        │
        ├── components/
        │   ├── layout/              # AppShell, Sidebar (user name + logout + Users link)
        │   └── requirements/        # StatusBadge, PriorityBadge
        │
        ├── lib/
        │   ├── utils.ts             # cn(), formatDate(), formatRelativeTime(), color helpers
        │   └── constants.ts         # STATUS_COLORS, PRIORITY_COLORS, enum option arrays
        │
        └── types/
            └── index.ts             # TypeScript interfaces matching backend schemas
```

---

## Data Model

### Requirement

The central entity. All other entities relate back to requirements.

| Field | Type | Description |
|---|---|---|
| `req_id` | string | Auto-generated sequential ID: `REQ-001`, `REQ-002`, ... |
| `title` | string | Brief, descriptive title (3–500 chars) |
| `description` | text | Full description of the requirement (min 10 chars) |
| `source` | enum | How the requirement was discovered (see Source options) |
| `stakeholder` | FK | The person who owns or provided this requirement |
| `system` | FK | The system this requirement belongs to |
| `priority` | enum | `Critical`, `High`, `Medium`, `Low` |
| `confidence` | enum | `High`, `Medium`, `Low`, `Unknown` — how certain we are |
| `business_impact` | text | Describes the business consequences if not implemented |
| `technical_impact` | text | Describes the technical effort or risks |
| `status` | enum | Current lifecycle stage (see Status Workflow) |
| `notes` | text | Free-form additional context |
| `tags` | many-to-many | Normalized lowercase labels |
| `related_requirements` | self-join | Linked requirements (bidirectional) |
| `evidence` | one-to-many | Attached files |
| `created_at` / `updated_at` | datetime | Automatic timestamps |

### Stakeholder

| Field | Description |
|---|---|
| `name` | Full name |
| `email` | Contact email (optional, unique) |
| `role` | Job title or role (optional) |
| `department` | Organizational unit (optional) |

### System

| Field | Description |
|---|---|
| `name` | System name |
| `description` | What the system does |
| `system_type` | Classification (e.g. "Legacy Mainframe", "Web API", "Database") |

### Tag

Tags are auto-created when referenced by a requirement. They are normalized to lowercase on write. The tags list endpoint includes a `usage_count` for each tag.

### Evidence

| Field | Description |
|---|---|
| `filename` | Original filename as uploaded |
| `stored_filename` | UUID-based on-disk filename (prevents collisions) |
| `content_type` | MIME type |
| `file_size` | Bytes |

---

## Status Workflow

Requirements progress through a governed lifecycle. The server enforces valid transitions — invalid transitions return HTTP 422.

```
                    ┌──────────┐
             ┌─────►│  Draft   │◄────────────────────┐
             │      └────┬─────┘                     │
             │           │ Submit for Review          │
             │           ▼                            │
             │    ┌──────────────┐                   │
             │    │ Under Review │──────────────────►─┤ (Send Back)
             │    └──────┬───┬──┘                   │
             │           │   │                       │
             │    Approve│   │Reject                 │
             │           │   │                       │
             │           ▼   ▼                       │
             │    ┌──────────┐ ┌──────────┐         │
             │    │ Approved │ │ Rejected │─────────►┘
             │    └────┬─────┘ └──────────┘
             │         │
             │    Start│Work
             │         │
             │         ├─────────────────────┐
             │         ▼                     ▼
             │   ┌─────────────┐       ┌──────────┐
             │   │ In Progress │       │ Deferred │──────►Draft / Under Review
             │   └──────┬──────┘       └──────────┘
             │          │
             │   Complete│
             │          ▼
             │   ┌───────────┐
             └───│ Completed │
                 └───────────┘
```

**Valid transitions:**

| From | To |
|---|---|
| Draft | Under Review |
| Under Review | Approved, Rejected, Draft (send back) |
| Approved | In Progress, Deferred |
| Rejected | Draft (resubmit) |
| In Progress | Completed, Deferred |
| Deferred | Draft, Under Review |
| Completed | — (terminal state) |

---

## API Reference

Base URL: `http://localhost:8000/api/v1`

Full interactive documentation is available at `http://localhost:8000/docs` when the backend is running.

All endpoints except `/auth/register` and `/auth/login` require a valid JWT in the `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | none | Create account. First user → Admin, others → Analyst. Returns token. |
| `POST` | `/auth/login` | none | Login with email + password. Returns token + user profile. |
| `GET` | `/auth/me` | any | Returns the current user's profile. |

**Example: Register and capture token**

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","full_name":"Admin User","password":"mypassword"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
```

### Users (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users` | List all users |
| `PATCH` | `/users/{id}/role` | Change a user's role (`admin` or `analyst`) |
| `PATCH` | `/users/{id}/deactivate` | Deactivate a user account |

### Requirements

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/requirements` | List requirements with filtering, sorting, and pagination |
| `POST` | `/requirements` | Create a new requirement |
| `GET` | `/requirements/{req_id}` | Get a single requirement by ID (e.g. `REQ-001`) |
| `PUT` | `/requirements/{req_id}` | Update a requirement |
| `DELETE` | `/requirements/{req_id}` | Delete a requirement |
| `PATCH` | `/requirements/{req_id}/status` | Transition status (enforces valid workflow) |
| `POST` | `/requirements/{req_id}/relations/{target}` | Link two requirements |
| `DELETE` | `/requirements/{req_id}/relations/{target}` | Remove a relation |
| `GET` | `/requirements/export` | Download filtered requirements as CSV |

**GET `/requirements` — Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `q` | string | Full-text search (title, description, req_id) |
| `status` | string | Filter by status value |
| `priority` | string | Filter by priority value |
| `source` | string | Filter by source value |
| `system_id` | integer | Filter by system |
| `stakeholder_id` | integer | Filter by stakeholder |
| `tag` | string | Filter by tag name |
| `confidence` | string | Filter by confidence level |
| `sort_by` | string | Column to sort by (default: `updated_at`) |
| `sort_dir` | `asc` or `desc` | Sort direction (default: `desc`) |
| `page` | integer | Page number (default: 1) |
| `page_size` | integer | Results per page (default: 25, max: 100) |

**Example: Create a requirement**

```bash
curl -X POST http://localhost:8000/api/v1/requirements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "User sessions must expire after 30 minutes of inactivity",
    "description": "The system must automatically terminate user sessions after 30 consecutive minutes with no activity to reduce exposure from unattended terminals.",
    "source": "SME Interview",
    "priority": "High",
    "confidence": "High",
    "tag_names": ["auth", "security", "session-management"]
  }'
```

**Example response:**

```json
{
  "id": 1,
  "req_id": "REQ-001",
  "title": "User sessions must expire after 30 minutes of inactivity",
  "status": "Draft",
  "priority": "High",
  "confidence": "High",
  "source": "SME Interview",
  "stakeholder": null,
  "system": null,
  "tags": [
    {"id": 1, "name": "auth"},
    {"id": 2, "name": "security"},
    {"id": 3, "name": "session-management"}
  ],
  "related_requirements": [],
  "evidence": [],
  "created_at": "2026-05-28T18:00:00",
  "updated_at": "2026-05-28T18:00:00"
}
```

### Evidence

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/requirements/{req_id}/evidence` | List evidence files |
| `POST` | `/requirements/{req_id}/evidence` | Upload a file (multipart/form-data) |
| `GET` | `/evidence/{id}/download` | Download a file |
| `DELETE` | `/evidence/{id}` | Delete a file |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard/stats` | Aggregate counts by status, priority, source; recent requirements |

### Stakeholders / Systems / Tags

All support standard CRUD. Stakeholders and Systems cannot be deleted while requirements reference them.

---

## Security

Security was designed in from the start, not bolted on:

| Control | Implementation |
|---|---|
| **SQL Injection** | All queries use SQLAlchemy ORM with parameterized statements — no raw SQL |
| **Input Validation** | Pydantic v2 validates all request bodies server-side with strict field types and length limits |
| **Frontend Validation** | Zod schemas enforce the same constraints client-side before submission |
| **File Type Validation** | Uploaded files checked against an extension allowlist (`.pdf`, `.docx`, `.xlsx`, `.png`, `.jpg`, `.jpeg`, `.txt`, `.csv`, `.md`) |
| **File Size Limit** | 25 MB maximum per file, enforced in the service layer before writing to disk |
| **Path Traversal** | File storage uses `pathlib.Path.resolve()` with a base-directory prefix check to block `../` attacks |
| **Download Safety** | Files served with `Content-Disposition: attachment` to prevent browser execution; `X-Content-Type-Options: nosniff` on all responses |
| **XSS Prevention** | React's JSX escaping prevents reflected XSS; no `dangerouslySetInnerHTML` usage |
| **Security Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-XSS-Protection: 1; mode=block` |
| **CORS** | Explicitly configured via `CORS_ORIGINS` env var — no wildcard `*` in production |
| **No Hardcoded Secrets** | All configuration via environment variables, validated at startup by `pydantic-settings` |
| **JWT Authentication** | `python-jose` (HS256) with 8-hour token expiry; `passlib[bcrypt]` for password hashing; all protected routes use `get_current_user` dependency at the router level |
| **Role Enforcement** | Admin-only routes use a `require_admin` dependency that returns HTTP 403 for non-admin tokens |

---

## Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and adjust as needed.

```env
DATABASE_URL=sqlite+aiosqlite:///./data/requirements.db
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=25
CORS_ORIGINS=["http://localhost:5173"]
APP_VERSION=0.2.0
SECRET_KEY=change-me-in-production-use-a-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | SQLite in `./data/` | SQLAlchemy async connection string |
| `UPLOAD_DIR` | `./uploads` | Directory for evidence file storage |
| `MAX_UPLOAD_SIZE_MB` | `25` | Maximum allowed upload size in megabytes |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | JSON array of allowed frontend origins |
| `APP_VERSION` | `0.2.0` | Returned by the `/health` endpoint |
| `SECRET_KEY` | *(change this)* | Secret used to sign JWTs — use a long random string in production |
| `ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Token lifetime in minutes (default: 8 hours) |

> **Important:** Change `SECRET_KEY` before deploying. Generate one with: `python -c "import secrets; print(secrets.token_hex(32))"`

### Frontend (`frontend/.env`)

Only needed if changing the default API URL:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

In development, the Vite proxy handles routing `/api` to `localhost:8000` automatically, so this variable is only relevant for production builds.

---

## Running Tests

### Backend

```bash
cd backend
source .venv/bin/activate
pytest -v
```

Tests use an in-memory SQLite database — no setup required. Authentication is bypassed via a `get_current_user` dependency override in `conftest.py`, so all 50 tests run without needing a real token.

**Coverage (50 tests):**
- Requirements: CRUD, auto-generated IDs, pagination, filtering, search, status workflow transitions, relations
- Stakeholders: CRUD, deletion protection when in use
- Systems: CRUD, deletion protection when in use
- Tags: auto-creation, normalization, usage counts
- Evidence: file upload, download, delete, type/size validation
- Dashboard: aggregate stats

### Frontend

The TypeScript compiler acts as a type-level test suite:

```bash
cd frontend
npm run build     # Runs tsc -b then vite build — zero errors = passing
```

---

## Troubleshooting

**Backend won't start — `ModuleNotFoundError`**
Ensure your virtual environment is activated: `source .venv/bin/activate`

**Backend won't start — `Address already in use`**
Another process is on port 8000. Change the port: `uvicorn app.main:app --reload --port 8001`
Then update `VITE_API_URL` in `frontend/.env` and restart the dev server.

**Frontend shows blank page or network errors**
Ensure the backend is running on port 8000. The Vite dev server proxies `/api` to `localhost:8000`.

**File uploads fail with 422**
The file type is not on the allowlist (`.pdf`, `.docx`, `.xlsx`, `.png`, `.jpg`, `.jpeg`, `.txt`, `.csv`, `.md`) or the file exceeds 25 MB.

**"Cannot delete stakeholder" error**
One or more requirements are linked to this stakeholder. Reassign or delete those requirements first.

**App redirects to `/login` immediately**
Your session token has expired or was cleared. Register a new account (or use an existing one) to log back in. Token lifetime is controlled by `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 8 hours).

**"Registration failed" — first registration only**
Ensure the backend is running and the `users` table was created. If you started the backend before the v2 code was in place, delete `backend/data/requirements.db` and restart — the lifespan event will recreate all tables including `users`.

**Database in unexpected state**
Delete `backend/data/requirements.db` and restart the server. The database will be recreated automatically on startup.

---

## Roadmap

The current MVP covers **Requirements Management**. Planned feature areas from the original design document:

| Feature | Description |
|---|---|
| **Assumptions & Unknowns Registry** | Explicit tracking of unvalidated assumptions, open questions, and investigation tasks |
| **Legacy Behavior Catalog** | Document undocumented system behaviors, edge cases, and manual workarounds |
| **Decision Log** | Record architectural and modernization decisions with rationale, alternatives, and approval history |
| **Dependency Mapping** | Map relationships between systems, APIs, databases, and business processes |
| **Test Case Integration** | Link requirements to test cases and track validation status |
| **Defect Traceability** | Link defects back to requirements for regression analysis |
| **AI-Assisted Analysis** | Transcript summarization, duplicate detection, risk flagging, change impact suggestions |
| **Excel / Word Export** | Expand export beyond CSV to Excel and formatted Word documents for stakeholder reporting |
| **Approval Audit Trail** | Record who approved or rejected each status transition, and when |
| **PostgreSQL Support** | Change `DATABASE_URL` to a PostgreSQL connection string — the ORM code requires no changes |
