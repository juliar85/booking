import uuid

import pytest

from app.models.laptop_group import LaptopGroup
from app.services.laptop_group_service import create_laptop_group


@pytest.fixture()
def group(db):
    return create_laptop_group(db, building="Main", floor=1, laptop_count=5)


class TestListLaptopGroups:
    def test_requires_auth(self, client):
        resp = client.get("/laptop-groups")
        assert resp.status_code == 401

    def test_returns_active_groups(self, client, admin_headers, group):
        resp = client.get("/laptop-groups", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["building"] == "Main"
        assert data[0]["floor"] == 1
        assert data[0]["laptop_count"] == 5

    def test_teacher_can_list(self, client, teacher_headers, group):
        resp = client.get("/laptop-groups", headers=teacher_headers)
        assert resp.status_code == 200

    def test_excludes_inactive_groups(self, client, admin_headers, group):
        client.delete(f"/laptop-groups/{group.id}", headers=admin_headers)
        resp = client.get("/laptop-groups", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json() == []


class TestCreateLaptopGroup:
    def test_requires_auth(self, client):
        resp = client.post("/laptop-groups", json={"building": "A", "floor": 1, "laptop_count": 5})
        assert resp.status_code == 401

    def test_teacher_cannot_create(self, client, teacher_headers):
        resp = client.post(
            "/laptop-groups",
            json={"building": "A", "floor": 1, "laptop_count": 5},
            headers=teacher_headers,
        )
        assert resp.status_code == 403

    def test_admin_creates_group(self, client, admin_headers):
        resp = client.post(
            "/laptop-groups",
            json={"building": "Main", "floor": 2, "laptop_count": 8},
            headers=admin_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["building"] == "Main"
        assert data["floor"] == 2
        assert data["laptop_count"] == 8
        assert data["is_active"] is True
        assert "id" in data

    def test_duplicate_building_floor_returns_409(self, client, admin_headers, group):
        resp = client.post(
            "/laptop-groups",
            json={"building": "Main", "floor": 1, "laptop_count": 3},
            headers=admin_headers,
        )
        assert resp.status_code == 409

    def test_invalid_laptop_count_returns_422(self, client, admin_headers):
        resp = client.post(
            "/laptop-groups",
            json={"building": "A", "floor": 1, "laptop_count": 0},
            headers=admin_headers,
        )
        assert resp.status_code == 422

    def test_negative_floor_returns_422(self, client, admin_headers):
        resp = client.post(
            "/laptop-groups",
            json={"building": "A", "floor": -1, "laptop_count": 5},
            headers=admin_headers,
        )
        assert resp.status_code == 422


class TestUpdateLaptopGroup:
    def test_admin_updates_group(self, client, admin_headers, group):
        resp = client.patch(
            f"/laptop-groups/{group.id}",
            json={"laptop_count": 10},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["laptop_count"] == 10

    def test_teacher_cannot_update(self, client, teacher_headers, group):
        resp = client.patch(
            f"/laptop-groups/{group.id}",
            json={"laptop_count": 10},
            headers=teacher_headers,
        )
        assert resp.status_code == 403

    def test_not_found_returns_404(self, client, admin_headers):
        resp = client.patch(
            f"/laptop-groups/{uuid.uuid4()}",
            json={"laptop_count": 10},
            headers=admin_headers,
        )
        assert resp.status_code == 404


class TestDeactivateLaptopGroup:
    def test_admin_deactivates_group(self, client, admin_headers, group):
        resp = client.delete(f"/laptop-groups/{group.id}", headers=admin_headers)
        assert resp.status_code == 200
        assert "deactivated" in resp.json()["message"]

    def test_teacher_cannot_deactivate(self, client, teacher_headers, group):
        resp = client.delete(f"/laptop-groups/{group.id}", headers=teacher_headers)
        assert resp.status_code == 403

    def test_not_found_returns_404(self, client, admin_headers):
        resp = client.delete(f"/laptop-groups/{uuid.uuid4()}", headers=admin_headers)
        assert resp.status_code == 404
