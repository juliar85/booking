# Laptop Booking System

Web application for managing teacher accounts and laptop bookings at a school.

## Overview

- **Admin** creates teacher accounts, views them, and deletes them.
- **Teachers** log in, set a permanent password on first login, and will eventually book laptops.
- New teacher accounts are created with a temporary password; on first login the system forces a password change.

---

## Quick start

```bash
make          # show all available commands
make up       # start the full stack with Docker
make test     # run all tests (backend + frontend)
```

---

## Architecture

```
Booking/
├── backend/          # FastAPI (Python 3.12)
├── frontend/         # React 19 + TypeScript (Vite)
├── docker-compose.yml
├── Makefile          # Helper commands (run `make` to list them)
└── .env              # Environment variables (never commit secrets)
```

### Backend

```
backend/app/
├── main.py           # FastAPI app, CORS, lifespan (seeds admin on first start)
├── config.py         # Settings via pydantic-settings (reads .env)
├── database.py       # SQLAlchemy engine + SessionLocal
├── dependencies.py   # get_db, get_current_user, require_admin
├── seed.py           # Creates the admin account if it does not exist
├── models/
│   └── user.py       # User: id, email, first_name, last_name, hashed_password, role,
│                     #       is_temporary_password, is_active
├── routers/
│   ├── auth.py       # POST /auth/login · GET /auth/me · POST /auth/change-password
│   └── admin.py      # POST /admin/teachers · GET /admin/teachers · DELETE /admin/teachers/{id}
├── schemas/
│   ├── auth.py       # LoginRequest, LoginResponse, ChangePasswordRequest, MessageResponse
│   └── user.py       # UserMe, CreateTeacherRequest, TeacherResponse
└── services/
    ├── auth_service.py   # hash_password, verify_password, create_access_token, decode_access_token
    └── user_service.py   # create_teacher, list_teachers, delete_teacher
```

**Tech stack:** FastAPI · SQLAlchemy · PostgreSQL · Alembic · JWT (python-jose) · bcrypt (passlib)

### Frontend

```
frontend/src/
├── api/client.ts             # Axios instance with JWT Bearer token interceptor
├── contexts/AuthContext.tsx  # Global auth state; rehydrates from localStorage on load
├── routes/ProtectedRoute.tsx # Route guard (optional adminOnly prop)
├── pages/
│   ├── LoginPage.tsx
│   ├── ChangePasswordPage.tsx
│   └── DashboardPage.tsx
└── components/admin/
    ├── CreateTeacherForm.tsx
    └── TeacherList.tsx
```

**Tech stack:** React 19 · TypeScript · React Router v7 · Axios · Vite

### Authentication flow

1. `POST /auth/login` → returns JWT token + user data
2. Token stored in `localStorage`; injected as `Authorization: Bearer <token>` by Axios interceptor
3. On app load, `AuthContext` calls `GET /auth/me` to rehydrate user state
4. `ProtectedRoute` blocks unauthenticated users; `adminOnly` flag blocks non-admins
5. Tokens expire after 8 hours (configurable via `JWT_EXPIRE_HOURS`)

---

## Running the project

### With Docker (recommended)

```bash
cp .env.example .env   # edit values as needed
make up                # builds images and starts all services
```

Or in the background: `make up-detached`

- Frontend: http://localhost
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

Nginx proxies `/auth/*` and `/admin/*` to the backend; everything else is served as the React SPA.

Useful Docker commands:
```bash
make logs   # follow logs from all containers
make ps     # check container status
make down   # stop and remove containers
```

### Local development (without Docker)

**Prerequisites:** Python 3.12, Node.js 20+, PostgreSQL 16

```bash
cp .env.example .env   # set DATABASE_URL to point to your local PostgreSQL
```

**Backend:**
```bash
python -m venv backend/.venv
source backend/.venv/bin/activate   # Windows: backend\.venv\Scripts\activate
make be-install
make be-migrate
make be-run
```
API available at http://localhost:8000

**Frontend:**
```bash
make fe-install
make fe-run
```
App available at http://localhost:5173 (proxies API calls to localhost:8000)

---

## Environment variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/booking` |
| `JWT_SECRET_KEY` | Secret for signing JWT tokens — keep this secret | 64-char hex string |
| `JWT_EXPIRE_HOURS` | Token lifetime in hours | `8` |
| `ADMIN_EMAIL` | Seeded admin account email | `admin@school.ee` |
| `ADMIN_FIRST_NAME` | Seeded admin first name | `Admin` |
| `ADMIN_LAST_NAME` | Seeded admin last name | `Admin` |
| `ADMIN_PASSWORD` | Seeded admin password | `Admin1234!` |
| `POSTGRES_DB` | (Docker only) Database name | `booking` |
| `POSTGRES_USER` | (Docker only) DB user | `postgres` |
| `POSTGRES_PASSWORD` | (Docker only) DB password | `postgres` |

The admin account is created automatically on first startup if it does not exist yet.

---

## Database migrations

Migrations live in `backend/alembic/versions/` and are applied automatically on container startup via `entrypoint.sh`. For local development you apply them manually.

### Apply pending migrations

```bash
make be-migrate
```

### Create a migration after changing a model

```bash
# 1. Edit the SQLAlchemy model in backend/app/models/
# 2. Generate the migration file:
make be-migrate-new MSG="describe your change"
# 3. Review the generated file in backend/alembic/versions/ — always check it before applying
# 4. Apply:
make be-migrate
```

> **Always review the generated file.** Alembic's `--autogenerate` is helpful but not infallible — it can miss some changes (e.g. check constraints, server defaults) or generate no-op operations for type differences between SQLAlchemy and PostgreSQL.

### Roll back the last migration

```bash
make be-migrate-down
```

### View migration history

```bash
make be-migrate-history
```

---

## Testing

Tests are a first-class part of this project. **Every new feature or bug fix must include tests, and all tests must pass before a task is considered done.**

### Run all tests

```bash
make test
```

### Backend tests

**Stack:** pytest · httpx · SQLite in-memory (no Docker or running database needed)

```bash
make be-test          # run tests
make be-coverage      # run tests + show line coverage
```

**Test structure:**
```
backend/tests/
├── conftest.py              # Shared fixtures (see below)
├── unit/
│   ├── test_auth_service.py # Pure function tests: hashing, JWT
│   ├── test_schemas.py      # Pydantic validators
│   └── test_user_service.py # Service layer against SQLite
└── integration/
    ├── test_auth_endpoints.py   # /auth/* HTTP tests
    ├── test_admin_endpoints.py  # /admin/* HTTP tests
    └── test_dependencies.py     # Edge cases: deleted users, deactivation
```

**How fixtures work (`conftest.py`):**

SQLite with `StaticPool` ensures all connections share the same in-memory database, so data inserted in fixtures is visible to the `TestClient`:

```
engine (StaticPool, sqlite:///:memory:)
  └─ db        — creates tables, yields Session, drops tables after each test
      └─ client — TestClient with get_db overridden to use the test db
          └─ admin_user, teacher_user — insert users via db
              └─ admin_token, teacher_token — login via client
                  └─ admin_headers, teacher_headers — {"Authorization": "Bearer ..."}
```

**Writing a new backend test:**

```python
# Integration test — use client + auth headers fixtures
def test_new_endpoint_returns_200(client, admin_headers):
    resp = client.get("/new-endpoint", headers=admin_headers)
    assert resp.status_code == 200

# Unit test — use db fixture to test the service layer directly
def test_new_service_function(db):
    result = my_service_function(db, ...)
    assert result.some_field == expected_value
```

> **Note on SQLite vs PostgreSQL:** The `CheckConstraint` on the `role` column is silently ignored by SQLite. This is acceptable because the constraint is enforced at the service layer. All other behaviour is identical.

---

### Frontend tests

**Stack:** Vitest · React Testing Library · MSW v2 · jsdom

```bash
make fe-test           # run tests once
make fe-test-watch     # watch mode (re-runs on file changes)
make fe-coverage       # run tests + show coverage
```

**Test structure:**
```
frontend/src/
├── test/
│   ├── setup.ts                # jest-dom matchers · MSW lifecycle · localStorage.clear()
│   ├── mswServer.ts            # MSW Node server instance
│   ├── handlers.ts             # Default happy-path handlers for all API endpoints
│   └── renderWithProviders.tsx # RTL render() wrapped with AuthProvider + MemoryRouter
├── contexts/AuthContext.test.tsx
├── routes/ProtectedRoute.test.tsx
├── pages/
│   ├── LoginPage.test.tsx
│   ├── ChangePasswordPage.test.tsx
│   └── DashboardPage.test.tsx
└── components/admin/
    ├── CreateTeacherForm.test.tsx
    └── TeacherList.test.tsx
```

**How mocking works:**

MSW intercepts HTTP at the network level — axios is never mocked directly. The default handlers in `handlers.ts` cover all existing endpoints with happy-path responses. Override a handler for a specific test with `server.use(...)`:

```typescript
import { http, HttpResponse } from "msw";
import { server } from "../test/mswServer";

it("shows error on 401", async () => {
  server.use(
    http.post("http://localhost/auth/login", () =>
      HttpResponse.json({ detail: "Invalid credentials" }, { status: 401 })
    )
  );
  // ... render and assert
});
```

The override is automatically reset after each test by `server.resetHandlers()` in `setup.ts`.

**Writing a new frontend test:**

```typescript
// Component that uses AuthContext or React Router
import { renderWithProviders } from "../../test/renderWithProviders";

it("renders correctly when logged in", async () => {
  localStorage.setItem("token", "test-token"); // simulate logged-in state
  renderWithProviders(<MyPage />, { initialEntries: ["/my-route"] });
  expect(await screen.findByText("Expected text")).toBeInTheDocument();
});

// Component with no context dependencies — plain RTL render is fine
import { render, screen } from "@testing-library/react";

it("renders a list", async () => {
  render(<MyList />);
  expect(await screen.findByText("Some item")).toBeInTheDocument();
});
```

**Key rules:**
- Use `screen.findBy*()` (async) for anything that appears after an API call
- Use `screen.getBy*()` (sync) only for elements that are immediately in the DOM
- Never mock axios directly — use MSW handlers
- `localStorage` is cleared automatically after each test (by `setup.ts`)
- Use `MemoryRouter` via `renderWithProviders` instead of `BrowserRouter`

---

## Development workflow

1. **Before starting:** confirm a green baseline
   ```bash
   make test
   ```

2. **While implementing:** write tests alongside the feature code

3. **Before finishing:** run tests and fix any failures
   ```bash
   make test
   ```

4. **New endpoint** checklist:
   - Add route in `backend/app/routers/`
   - Add business logic in `backend/app/services/`
   - Add Pydantic schemas in `backend/app/schemas/`
   - Add unit tests for the service function (`tests/unit/`)
   - Add integration tests for the endpoint (`tests/integration/`) — cover: happy path, auth errors (401/403), business rule violations

5. **New frontend page/component** checklist:
   - Create the component file
   - Create `ComponentName.test.tsx` next to it
   - If a new API endpoint is involved, add a default handler to `src/test/handlers.ts`
   - Test: renders correctly, handles loading state, handles API errors, navigation works

6. **Database schema change:**
   - Update the SQLAlchemy model in `backend/app/models/`
   - Generate and review the migration: `make be-migrate-new MSG="describe change"`
   - Apply it: `make be-migrate`
   - Update affected tests if column names or behaviour changed
