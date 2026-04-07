"""Integration tests for dependency edge-cases."""


def test_deleted_user_token_returns_401(client, db, teacher_user, teacher_headers):
    """A token that was valid when issued becomes invalid after the user is deleted."""
    # Confirm the token works before deletion
    resp = client.get("/auth/me", headers=teacher_headers)
    assert resp.status_code == 200

    # Delete the user directly from the DB
    db.delete(teacher_user)
    db.commit()

    # The same token should now be rejected
    resp = client.get("/auth/me", headers=teacher_headers)
    assert resp.status_code == 401


def test_inactive_user_token_returns_401(client, db, teacher_user, teacher_headers):
    """Deactivating a user invalidates their token for subsequent requests."""
    teacher_user.is_active = False
    db.commit()

    resp = client.get("/auth/me", headers=teacher_headers)
    assert resp.status_code == 401


def test_require_admin_blocks_teacher(client, teacher_headers, teacher_user):
    resp = client.get("/admin/teachers", headers=teacher_headers)
    assert resp.status_code == 403
