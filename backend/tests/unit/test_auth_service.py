"""Unit tests for app.services.auth_service — no database required."""

import os

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-tests-only")
os.environ.setdefault("JWT_EXPIRE_HOURS", "8")
os.environ.setdefault("ADMIN_EMAIL", "admin@test.com")
os.environ.setdefault("ADMIN_FIRST_NAME", "Admin")
os.environ.setdefault("ADMIN_LAST_NAME", "User")
os.environ.setdefault("ADMIN_PASSWORD", "adminpassword123")

from datetime import timedelta, timezone, datetime

import pytest
from jose import jwt

from app.services.auth_service import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.config import settings


# ---------------------------------------------------------------------------
# hash_password / verify_password
# ---------------------------------------------------------------------------

def test_hash_password_returns_bcrypt_string():
    hashed = hash_password("secret")
    assert hashed.startswith("$2b$")


def test_verify_password_correct_returns_true():
    hashed = hash_password("mypassword")
    assert verify_password("mypassword", hashed) is True


def test_verify_password_wrong_returns_false():
    hashed = hash_password("mypassword")
    assert verify_password("wrongpassword", hashed) is False


def test_hash_is_not_equal_to_plain():
    plain = "plaintextpassword"
    assert hash_password(plain) != plain


def test_two_hashes_of_same_password_differ():
    h1 = hash_password("samepassword")
    h2 = hash_password("samepassword")
    assert h1 != h2


# ---------------------------------------------------------------------------
# create_access_token
# ---------------------------------------------------------------------------

def test_create_token_returns_string():
    token = create_access_token("user-id-1", "user@example.com", "teacher")
    assert isinstance(token, str)
    assert len(token) > 0


def test_create_token_contains_expected_claims():
    token = create_access_token("user-id-42", "admin@example.com", "admin")
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
    assert payload["user_id"] == "user-id-42"
    assert payload["sub"] == "admin@example.com"
    assert payload["role"] == "admin"
    assert "exp" in payload
    assert "iat" in payload


def test_create_token_role_is_preserved():
    token = create_access_token("id-1", "teacher@example.com", "teacher")
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
    assert payload["role"] == "teacher"


def test_token_expiry_is_approximately_8_hours():
    token = create_access_token("id-1", "user@example.com", "admin")
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
    delta_seconds = payload["exp"] - payload["iat"]
    assert abs(delta_seconds - 8 * 3600) <= 5  # allow 5s clock drift


# ---------------------------------------------------------------------------
# decode_access_token
# ---------------------------------------------------------------------------

def test_decode_valid_token_returns_payload():
    token = create_access_token("uid-99", "u@e.com", "teacher")
    payload = decode_access_token(token)
    assert payload["user_id"] == "uid-99"
    assert payload["role"] == "teacher"


def test_decode_tampered_token_returns_empty_dict():
    token = create_access_token("uid-1", "u@e.com", "admin")
    tampered = token[:-5] + "XXXXX"
    assert decode_access_token(tampered) == {}


def test_decode_expired_token_returns_empty_dict():
    now = datetime.now(timezone.utc)
    payload = {
        "sub": "u@e.com",
        "user_id": "uid-1",
        "role": "teacher",
        "exp": now - timedelta(seconds=1),
        "iat": now - timedelta(hours=8),
    }
    expired_token = jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")
    assert decode_access_token(expired_token) == {}


def test_decode_garbage_string_returns_empty_dict():
    assert decode_access_token("not.a.jwt.token") == {}


def test_decode_empty_string_returns_empty_dict():
    assert decode_access_token("") == {}
