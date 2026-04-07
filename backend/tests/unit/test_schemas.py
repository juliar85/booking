"""Unit tests for Pydantic schemas — no database or HTTP required."""

import os

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-tests-only")
os.environ.setdefault("JWT_EXPIRE_HOURS", "8")
os.environ.setdefault("ADMIN_EMAIL", "admin@test.com")
os.environ.setdefault("ADMIN_FIRST_NAME", "Admin")
os.environ.setdefault("ADMIN_LAST_NAME", "User")
os.environ.setdefault("ADMIN_PASSWORD", "adminpassword123")

import pytest
from pydantic import ValidationError

from app.schemas.auth import ChangePasswordRequest, LoginRequest


# ---------------------------------------------------------------------------
# ChangePasswordRequest
# ---------------------------------------------------------------------------

def test_new_password_too_short_raises_validation_error():
    with pytest.raises(ValidationError):
        ChangePasswordRequest(current_password="old", new_password="short7")


def test_new_password_exactly_8_chars_is_valid():
    req = ChangePasswordRequest(current_password="old", new_password="exactly8")
    assert req.new_password == "exactly8"


def test_new_password_longer_than_8_is_valid():
    req = ChangePasswordRequest(current_password="old", new_password="averylongpassword")
    assert len(req.new_password) > 8


def test_current_password_has_no_length_restriction():
    req = ChangePasswordRequest(current_password="x", new_password="newpassword")
    assert req.current_password == "x"


# ---------------------------------------------------------------------------
# LoginRequest
# ---------------------------------------------------------------------------

def test_login_request_valid():
    req = LoginRequest(email="user@example.com", password="pass")
    assert req.email == "user@example.com"
    assert req.password == "pass"


def test_login_request_invalid_email_raises():
    with pytest.raises(ValidationError):
        LoginRequest(email="not-an-email", password="pass")


def test_login_request_requires_both_fields():
    with pytest.raises(ValidationError):
        LoginRequest(email="user@example.com")
