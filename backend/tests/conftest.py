"""
Shared test fixtures for the Booking backend test suite.

Database strategy: SQLite in-memory with StaticPool so that every call to
connect() returns the same underlying connection.  This means data inserted
inside the `db` fixture is visible to the FastAPI TestClient without any
extra flushing tricks.

Note: The PostgreSQL CheckConstraint on the `role` column is silently ignored
by SQLite.  Role validation is enforced at the application (service) layer so
this does not reduce test coverage.

The app's lifespan event (seed_admin) is skipped by NOT entering the TestClient
as a context manager.  All required users are created explicitly by the fixtures.
"""

import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set env vars BEFORE importing anything from app, so pydantic-settings picks them up.
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-tests-only")
os.environ.setdefault("JWT_EXPIRE_HOURS", "8")
os.environ.setdefault("ADMIN_EMAIL", "admin@test.com")
os.environ.setdefault("ADMIN_FIRST_NAME", "Admin")
os.environ.setdefault("ADMIN_LAST_NAME", "User")
os.environ.setdefault("ADMIN_PASSWORD", "adminpassword123")

from app.database import Base  # noqa: E402
from app.dependencies import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.auth_service import hash_password  # noqa: E402

SQLALCHEMY_TEST_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db():
    """Create all tables, yield a session, drop all tables after each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db):
    """TestClient with get_db overridden to use the test database."""
    def override_get_db():
        try:
            yield db
        finally:
            pass  # session lifecycle managed by `db` fixture

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app, raise_server_exceptions=True)
    yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_user(db):
    user = User(
        id=uuid.uuid4(),
        email="admin@test.com",
        first_name="Admin",
        last_name="User",
        hashed_password=hash_password("adminpassword123"),
        role="admin",
        is_temporary_password=False,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def teacher_user(db):
    user = User(
        id=uuid.uuid4(),
        email="teacher@test.com",
        first_name="Test",
        last_name="Teacher",
        hashed_password=hash_password("teacherpassword123"),
        role="teacher",
        is_temporary_password=True,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def admin_token(client, admin_user):
    resp = client.post("/auth/login", json={"email": "admin@test.com", "password": "adminpassword123"})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture()
def teacher_token(client, teacher_user):
    resp = client.post("/auth/login", json={"email": "teacher@test.com", "password": "teacherpassword123"})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture()
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture()
def teacher_headers(teacher_token):
    return {"Authorization": f"Bearer {teacher_token}"}
