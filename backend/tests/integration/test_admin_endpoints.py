"""Integration tests for /admin/* endpoints."""

import uuid


NEW_TEACHER = {
    "email": "newteacher@test.com",
    "first_name": "New",
    "last_name": "Teacher",
    "temporary_password": "temppass123",
}


# ---------------------------------------------------------------------------
# POST /admin/teachers
# ---------------------------------------------------------------------------

def test_create_teacher_as_admin_returns_201(client, admin_headers):
    resp = client.post("/admin/teachers", json=NEW_TEACHER, headers=admin_headers)
    assert resp.status_code == 201


def test_create_teacher_response_schema(client, admin_headers):
    resp = client.post("/admin/teachers", json=NEW_TEACHER, headers=admin_headers)
    data = resp.json()
    for key in ("id", "email", "first_name", "last_name", "role", "is_active", "password_is_temporary", "created_at"):
        assert key in data, f"Missing key: {key}"
    assert data["role"] == "teacher"
    assert data["password_is_temporary"] is True
    assert data["email"] == NEW_TEACHER["email"]


def test_create_teacher_duplicate_email_returns_400(client, admin_headers):
    client.post("/admin/teachers", json=NEW_TEACHER, headers=admin_headers)
    resp = client.post("/admin/teachers", json=NEW_TEACHER, headers=admin_headers)
    assert resp.status_code == 400


def test_create_teacher_as_teacher_role_returns_403(client, teacher_headers):
    resp = client.post("/admin/teachers", json=NEW_TEACHER, headers=teacher_headers)
    assert resp.status_code == 403


def test_create_teacher_without_auth_returns_401(client):
    resp = client.post("/admin/teachers", json=NEW_TEACHER)
    assert resp.status_code == 401


def test_create_teacher_invalid_email_returns_422(client, admin_headers):
    body = {**NEW_TEACHER, "email": "not-an-email"}
    resp = client.post("/admin/teachers", json=body, headers=admin_headers)
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# GET /admin/teachers
# ---------------------------------------------------------------------------

def test_list_teachers_returns_empty_initially(client, admin_headers):
    resp = client.get("/admin/teachers", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_teachers_returns_created_teachers(client, admin_headers):
    client.post("/admin/teachers", json=NEW_TEACHER, headers=admin_headers)
    resp = client.get("/admin/teachers", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["email"] == NEW_TEACHER["email"]


def test_list_teachers_excludes_admin_accounts(client, admin_headers, admin_user):
    # admin_user is already in DB; list should not include it
    resp = client.get("/admin/teachers", headers=admin_headers)
    assert resp.status_code == 200
    assert all(t["role"] == "teacher" for t in resp.json())


def test_list_teachers_as_teacher_returns_403(client, teacher_headers):
    resp = client.get("/admin/teachers", headers=teacher_headers)
    assert resp.status_code == 403


def test_list_teachers_without_auth_returns_401(client):
    resp = client.get("/admin/teachers")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# DELETE /admin/teachers/{id}
# ---------------------------------------------------------------------------

def _create_teacher(client, admin_headers, body=None):
    data = body or NEW_TEACHER
    resp = client.post("/admin/teachers", json=data, headers=admin_headers)
    assert resp.status_code == 201
    return resp.json()["id"]


def test_delete_teacher_returns_200(client, admin_headers):
    teacher_id = _create_teacher(client, admin_headers)
    resp = client.delete(f"/admin/teachers/{teacher_id}", headers=admin_headers)
    assert resp.status_code == 200
    assert "message" in resp.json()


def test_delete_teacher_removed_from_list(client, admin_headers):
    teacher_id = _create_teacher(client, admin_headers)
    client.delete(f"/admin/teachers/{teacher_id}", headers=admin_headers)
    resp = client.get("/admin/teachers", headers=admin_headers)
    ids = [t["id"] for t in resp.json()]
    assert teacher_id not in ids


def test_delete_nonexistent_returns_404(client, admin_headers):
    resp = client.delete(f"/admin/teachers/{uuid.uuid4()}", headers=admin_headers)
    assert resp.status_code == 404


def test_delete_admin_account_returns_400(client, admin_headers, admin_user):
    resp = client.delete(f"/admin/teachers/{admin_user.id}", headers=admin_headers)
    assert resp.status_code == 400


def test_delete_as_teacher_returns_403(client, teacher_headers, admin_headers):
    teacher_id = _create_teacher(
        client, admin_headers,
        {"email": "other@test.com", "first_name": "A", "last_name": "B", "temporary_password": "pass1234"},
    )
    resp = client.delete(f"/admin/teachers/{teacher_id}", headers=teacher_headers)
    assert resp.status_code == 403


def test_delete_without_auth_returns_401(client, admin_headers):
    teacher_id = _create_teacher(client, admin_headers)
    resp = client.delete(f"/admin/teachers/{teacher_id}")
    assert resp.status_code == 401


def test_delete_malformed_uuid_returns_422(client, admin_headers):
    resp = client.delete("/admin/teachers/not-a-uuid", headers=admin_headers)
    assert resp.status_code == 422
