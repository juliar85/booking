# Project: Laptop Booking System

Full-stack web app. FastAPI backend + React/TypeScript frontend.

## Testing Requirements

**Every feature addition or bug fix must include tests. A task is NOT complete until tests pass.**

### Adding new functionality

- New backend endpoint → add integration tests in `backend/tests/integration/`
- New service function → add unit tests in `backend/tests/unit/`
- New frontend page → add a `PageName.test.tsx` next to the page file
- New frontend component → add a `ComponentName.test.tsx` next to the component file
- New business rule → add a test that explicitly verifies it

### Before marking any task as done

`python` and `npm` are not available locally — all commands run inside Docker containers.

Run backend tests (if `api` container is running):
```bash
docker-compose exec api python -m pytest
```

Or as a one-off (starts a fresh container, then removes it):
```bash
docker-compose run --rm api python -m pytest
```

Run frontend tests (requires dev mode via `docker-compose.override.yml`):
```bash
docker-compose exec frontend npm test -- --watchAll=false
```

Or as a one-off:
```bash
docker-compose run --rm frontend npm test -- --watchAll=false
```

Both must pass with zero failures. If a test fails, fix it before considering the task complete.

### Test infrastructure

**Backend** — `backend/tests/`
- `conftest.py` — shared fixtures (`db`, `client`, `admin_user`, `teacher_user`, `admin_headers`, `teacher_headers`)
- SQLite in-memory with `StaticPool` — tests run inside the `api` container, no separate DB needed
- Dependency override pattern: `app.dependency_overrides[get_db] = override_get_db`

**Frontend** — `frontend/src/test/`
- `mswServer.ts` + `handlers.ts` — MSW intercepts all HTTP at network level
- `renderWithProviders.tsx` — wraps components with `AuthProvider` + `MemoryRouter`
- Override a handler for a specific test: `server.use(http.get(..., () => ...))`
- `localStorage` is cleared automatically after each test

### What NOT to do

- Do not skip writing tests because the feature "seems simple"
- Do not mock `axios` directly — use MSW handlers instead
- Do not use `BrowserRouter` in tests — use `MemoryRouter` via `renderWithProviders`
- Do not commit without running the tests first
