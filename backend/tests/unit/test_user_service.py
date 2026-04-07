"""Unit tests for app.services.user_service — uses the db fixture (SQLite in-memory)."""

import uuid

import pytest

from app.services.auth_service import verify_password
from app.services.user_service import create_teacher, delete_teacher, list_teachers


# ---------------------------------------------------------------------------
# create_teacher
# ---------------------------------------------------------------------------

def test_create_teacher_has_teacher_role(db):
    teacher = create_teacher(db, "t@example.com", "First", "Last", "temppass1")
    assert teacher.role == "teacher"


def test_create_teacher_sets_is_temporary_password_true(db):
    teacher = create_teacher(db, "t@example.com", "First", "Last", "temppass1")
    assert teacher.is_temporary_password is True


def test_create_teacher_password_is_hashed(db):
    plain = "temppass1"
    teacher = create_teacher(db, "t@example.com", "First", "Last", plain)
    assert teacher.hashed_password != plain
    assert verify_password(plain, teacher.hashed_password) is True


def test_create_teacher_stores_name_and_email(db):
    teacher = create_teacher(db, "john@example.com", "John", "Doe", "temppass1")
    assert teacher.email == "john@example.com"
    assert teacher.first_name == "John"
    assert teacher.last_name == "Doe"


def test_create_teacher_duplicate_email_raises(db):
    create_teacher(db, "dup@example.com", "First", "Last", "temppass1")
    with pytest.raises(ValueError, match="Email already exists"):
        create_teacher(db, "dup@example.com", "Another", "Person", "temppass2")


def test_create_teacher_is_active_by_default(db):
    teacher = create_teacher(db, "t@example.com", "First", "Last", "temppass1")
    assert teacher.is_active is True


# ---------------------------------------------------------------------------
# list_teachers
# ---------------------------------------------------------------------------

def test_list_teachers_empty_when_none(db):
    assert list_teachers(db) == []


def test_list_teachers_returns_created_teachers(db):
    create_teacher(db, "t1@example.com", "First", "Last", "p1")
    create_teacher(db, "t2@example.com", "Second", "Last", "p2")
    teachers = list_teachers(db)
    assert len(teachers) == 2


def test_list_teachers_excludes_admin_accounts(db):
    from app.models.user import User
    from app.services.auth_service import hash_password

    admin = User(
        id=uuid.uuid4(),
        email="admin@example.com",
        first_name="Admin",
        last_name="User",
        hashed_password=hash_password("adminpass"),
        role="admin",
        is_temporary_password=False,
    )
    db.add(admin)
    db.commit()
    create_teacher(db, "t@example.com", "First", "Last", "temppass")

    teachers = list_teachers(db)
    assert len(teachers) == 1
    assert all(t.role == "teacher" for t in teachers)


# ---------------------------------------------------------------------------
# delete_teacher
# ---------------------------------------------------------------------------

def test_delete_teacher_removes_from_db(db):
    teacher = create_teacher(db, "t@example.com", "First", "Last", "temppass")
    delete_teacher(db, teacher.id)
    assert list_teachers(db) == []


def test_delete_nonexistent_raises_lookup_error(db):
    with pytest.raises(LookupError, match="Teacher not found"):
        delete_teacher(db, uuid.uuid4())


def test_delete_admin_raises_permission_error(db):
    from app.models.user import User
    from app.services.auth_service import hash_password

    admin = User(
        id=uuid.uuid4(),
        email="admin@example.com",
        first_name="Admin",
        last_name="User",
        hashed_password=hash_password("adminpass"),
        role="admin",
        is_temporary_password=False,
    )
    db.add(admin)
    db.commit()

    with pytest.raises(PermissionError, match="Cannot delete admin accounts"):
        delete_teacher(db, admin.id)
