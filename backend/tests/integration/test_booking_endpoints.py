import uuid
from datetime import date, time

import pytest

from app.models.user import User
from app.services.auth_service import hash_password
from app.services.booking_service import create_booking
from app.services.laptop_group_service import create_laptop_group


@pytest.fixture()
def group(db):
    return create_laptop_group(db, building="Main", floor=1, laptop_count=5)


@pytest.fixture()
def teacher_user_2(db):
    user = User(
        email="teacher2@test.com",
        first_name="Second",
        last_name="Teacher",
        hashed_password=hash_password("teacherpassword123"),
        role="teacher",
        is_temporary_password=False,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def teacher_headers_2(client, teacher_user_2):
    resp = client.post(
        "/auth/login",
        json={"email": "teacher2@test.com", "password": "teacherpassword123"},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def existing_booking(db, teacher_user, group):
    return create_booking(
        db,
        teacher_id=teacher_user.id,
        laptop_group_id=group.id,
        booking_date=date(2026, 4, 7),
        start_time=time(9, 0),
        end_time=time(10, 0),
    )


WEEK_START = "2026-04-07"
VALID_BOOKING = {
    "booking_date": "2026-04-07",
    "start_time": "09:00:00",
    "end_time": "10:00:00",
}


class TestListBookings:
    def test_requires_auth(self, client, group):
        resp = client.get(f"/bookings?week_start={WEEK_START}&laptop_group_id={group.id}")
        assert resp.status_code == 401

    def test_requires_week_start(self, client, teacher_headers, group):
        resp = client.get(f"/bookings?laptop_group_id={group.id}", headers=teacher_headers)
        assert resp.status_code == 422

    def test_no_laptop_group_id_returns_all_bookings(self, client, teacher_headers, group, existing_booking):
        resp = client.get(f"/bookings?week_start={WEEK_START}", headers=teacher_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_invalid_date_returns_422(self, client, teacher_headers, group):
        resp = client.get(
            f"/bookings?week_start=notadate&laptop_group_id={group.id}",
            headers=teacher_headers,
        )
        assert resp.status_code == 422

    def test_returns_empty_initially(self, client, teacher_headers, group):
        resp = client.get(
            f"/bookings?week_start={WEEK_START}&laptop_group_id={group.id}",
            headers=teacher_headers,
        )
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_bookings_for_week(self, client, teacher_headers, group, existing_booking):
        resp = client.get(
            f"/bookings?week_start={WEEK_START}&laptop_group_id={group.id}",
            headers=teacher_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["booking_date"] == "2026-04-07"
        assert "teacher" in data[0]
        assert "laptop_group" in data[0]

    def test_excludes_other_groups(self, client, db, teacher_headers, teacher_user, group):
        group2 = create_laptop_group(db, building="Other", floor=1, laptop_count=3)
        create_booking(
            db,
            teacher_id=teacher_user.id,
            laptop_group_id=group2.id,
            booking_date=date(2026, 4, 7),
            start_time=time(9, 0),
            end_time=time(10, 0),
        )
        resp = client.get(
            f"/bookings?week_start={WEEK_START}&laptop_group_id={group.id}",
            headers=teacher_headers,
        )
        assert resp.json() == []


class TestCreateBooking:
    def test_requires_auth(self, client, group):
        resp = client.post("/bookings", json={**VALID_BOOKING, "laptop_group_id": str(group.id)})
        assert resp.status_code == 401

    def test_admin_cannot_create(self, client, admin_headers, group):
        resp = client.post(
            "/bookings",
            json={**VALID_BOOKING, "laptop_group_id": str(group.id)},
            headers=admin_headers,
        )
        assert resp.status_code == 403

    def test_teacher_creates_booking(self, client, teacher_headers, group):
        resp = client.post(
            "/bookings",
            json={**VALID_BOOKING, "laptop_group_id": str(group.id)},
            headers=teacher_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["booking_date"] == "2026-04-07"
        assert data["start_time"] == "09:00:00"
        assert data["end_time"] == "10:00:00"
        assert "teacher" in data
        assert "laptop_group" in data

    def test_overlap_returns_409(self, client, teacher_headers, group, existing_booking):
        resp = client.post(
            "/bookings",
            json={**VALID_BOOKING, "laptop_group_id": str(group.id)},
            headers=teacher_headers,
        )
        assert resp.status_code == 409

    def test_adjacent_slots_allowed(self, client, teacher_headers, group, existing_booking):
        resp = client.post(
            "/bookings",
            json={
                "laptop_group_id": str(group.id),
                "booking_date": "2026-04-07",
                "start_time": "10:00:00",
                "end_time": "11:00:00",
            },
            headers=teacher_headers,
        )
        assert resp.status_code == 201

    def test_invalid_time_boundary_returns_422(self, client, teacher_headers, group):
        resp = client.post(
            "/bookings",
            json={
                "laptop_group_id": str(group.id),
                "booking_date": "2026-04-07",
                "start_time": "09:05:00",
                "end_time": "10:00:00",
            },
            headers=teacher_headers,
        )
        assert resp.status_code == 422

    def test_start_after_end_returns_422(self, client, teacher_headers, group):
        resp = client.post(
            "/bookings",
            json={
                "laptop_group_id": str(group.id),
                "booking_date": "2026-04-07",
                "start_time": "10:00:00",
                "end_time": "09:00:00",
            },
            headers=teacher_headers,
        )
        assert resp.status_code == 422


class TestUpdateBooking:
    def test_own_booking_updated(self, client, teacher_headers, existing_booking):
        resp = client.patch(
            f"/bookings/{existing_booking.id}",
            json={"end_time": "11:00:00"},
            headers=teacher_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["end_time"] == "11:00:00"

    def test_other_teacher_returns_403(
        self, client, teacher_headers_2, existing_booking
    ):
        resp = client.patch(
            f"/bookings/{existing_booking.id}",
            json={"end_time": "11:00:00"},
            headers=teacher_headers_2,
        )
        assert resp.status_code == 403

    def test_not_found_returns_404(self, client, teacher_headers):
        resp = client.patch(
            f"/bookings/{uuid.uuid4()}",
            json={"end_time": "11:00:00"},
            headers=teacher_headers,
        )
        assert resp.status_code == 404

    def test_overlap_returns_409(self, client, db, teacher_headers, teacher_user, group, existing_booking):
        # Create a second booking; try to extend first into it
        create_booking(
            db,
            teacher_id=teacher_user.id,
            laptop_group_id=group.id,
            booking_date=date(2026, 4, 7),
            start_time=time(10, 0),
            end_time=time(11, 0),
        )
        resp = client.patch(
            f"/bookings/{existing_booking.id}",
            json={"end_time": "10:30:00"},
            headers=teacher_headers,
        )
        assert resp.status_code == 409


class TestDeleteBooking:
    def test_own_booking_deleted(self, client, teacher_headers, existing_booking):
        resp = client.delete(f"/bookings/{existing_booking.id}", headers=teacher_headers)
        assert resp.status_code == 200
        assert "deleted" in resp.json()["message"]

    def test_other_teacher_returns_403(
        self, client, teacher_headers_2, existing_booking
    ):
        resp = client.delete(f"/bookings/{existing_booking.id}", headers=teacher_headers_2)
        assert resp.status_code == 403

    def test_not_found_returns_404(self, client, teacher_headers):
        resp = client.delete(f"/bookings/{uuid.uuid4()}", headers=teacher_headers)
        assert resp.status_code == 404

    def test_requires_auth(self, client, existing_booking):
        resp = client.delete(f"/bookings/{existing_booking.id}")
        assert resp.status_code == 401
