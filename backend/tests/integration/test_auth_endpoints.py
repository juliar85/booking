"""Integration tests for /auth/* endpoints."""


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------

def test_login_success_returns_200(client, admin_user):
    resp = client.post("/auth/login", json={"email": "admin@test.com", "password": "adminpassword123"})
    assert resp.status_code == 200


def test_login_success_response_schema(client, admin_user):
    resp = client.post("/auth/login", json={"email": "admin@test.com", "password": "adminpassword123"})
    data = resp.json()
    for key in ("access_token", "token_type", "id", "email", "first_name", "last_name", "password_is_temporary", "role"):
        assert key in data, f"Missing key: {key}"
    assert data["token_type"] == "bearer"
    assert data["role"] == "admin"


def test_login_temporary_flag_true_for_new_teacher(client, teacher_user):
    resp = client.post("/auth/login", json={"email": "teacher@test.com", "password": "teacherpassword123"})
    assert resp.status_code == 200
    assert resp.json()["password_is_temporary"] is True


def test_login_permanent_flag_false_for_admin(client, admin_user):
    resp = client.post("/auth/login", json={"email": "admin@test.com", "password": "adminpassword123"})
    assert resp.status_code == 200
    assert resp.json()["password_is_temporary"] is False


def test_login_wrong_password_returns_401(client, admin_user):
    resp = client.post("/auth/login", json={"email": "admin@test.com", "password": "wrongpassword"})
    assert resp.status_code == 401


def test_login_nonexistent_user_returns_401(client):
    resp = client.post("/auth/login", json={"email": "nobody@test.com", "password": "pass"})
    assert resp.status_code == 401


def test_login_inactive_user_returns_401(client, db, teacher_user):
    teacher_user.is_active = False
    db.commit()
    resp = client.post("/auth/login", json={"email": "teacher@test.com", "password": "teacherpassword123"})
    assert resp.status_code == 401


def test_login_invalid_email_format_returns_422(client):
    resp = client.post("/auth/login", json={"email": "not-an-email", "password": "pass"})
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------

def test_me_returns_user_data(client, admin_headers, admin_user):
    resp = client.get("/auth/me", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "admin@test.com"
    assert data["role"] == "admin"


def test_me_without_token_returns_401(client, admin_user):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_me_with_invalid_token_returns_401(client):
    resp = client.get("/auth/me", headers={"Authorization": "Bearer invalidtoken"})
    assert resp.status_code == 401


def test_me_response_has_expected_fields(client, admin_headers, admin_user):
    resp = client.get("/auth/me", headers=admin_headers)
    data = resp.json()
    for key in ("id", "email", "first_name", "last_name", "role", "password_is_temporary", "is_active", "created_at"):
        assert key in data, f"Missing field: {key}"


# ---------------------------------------------------------------------------
# POST /auth/change-password
# ---------------------------------------------------------------------------

def test_change_password_success_returns_200(client, teacher_headers, teacher_user):
    resp = client.post(
        "/auth/change-password",
        json={"current_password": "teacherpassword123", "new_password": "newpassword"},
        headers=teacher_headers,
    )
    assert resp.status_code == 200
    assert "message" in resp.json()


def test_change_password_updates_hash_in_db(client, db, teacher_headers, teacher_user):
    client.post(
        "/auth/change-password",
        json={"current_password": "teacherpassword123", "new_password": "newpassword"},
        headers=teacher_headers,
    )
    db.refresh(teacher_user)
    from app.services.auth_service import verify_password
    assert verify_password("newpassword", teacher_user.hashed_password) is True


def test_change_password_sets_is_temporary_false(client, db, teacher_headers, teacher_user):
    assert teacher_user.is_temporary_password is True
    client.post(
        "/auth/change-password",
        json={"current_password": "teacherpassword123", "new_password": "newpassword"},
        headers=teacher_headers,
    )
    db.refresh(teacher_user)
    assert teacher_user.is_temporary_password is False


def test_change_password_wrong_current_returns_400(client, teacher_headers, teacher_user):
    resp = client.post(
        "/auth/change-password",
        json={"current_password": "wrongcurrent", "new_password": "newpassword"},
        headers=teacher_headers,
    )
    assert resp.status_code == 400


def test_change_password_short_new_returns_422(client, teacher_headers, teacher_user):
    resp = client.post(
        "/auth/change-password",
        json={"current_password": "teacherpassword123", "new_password": "short7"},
        headers=teacher_headers,
    )
    assert resp.status_code == 422


def test_change_password_without_auth_returns_401(client):
    resp = client.post(
        "/auth/change-password",
        json={"current_password": "old", "new_password": "newpassword"},
    )
    assert resp.status_code == 401
