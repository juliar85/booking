from datetime import date, time

import pytest

from app.models.laptop_group import LaptopGroup
from app.models.user import User
from app.services.auth_service import hash_password
from app.services.booking_service import (
    create_booking,
    delete_booking,
    get_booking,
    list_bookings_for_week,
    update_booking,
)
from app.services.laptop_group_service import create_laptop_group


@pytest.fixture()
def teacher(db):
    user = User(
        email="t@test.com",
        first_name="T",
        last_name="Teacher",
        hashed_password=hash_password("pw"),
        role="teacher",
        is_active=True,
        is_temporary_password=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def teacher2(db):
    user = User(
        email="t2@test.com",
        first_name="T2",
        last_name="Teacher2",
        hashed_password=hash_password("pw"),
        role="teacher",
        is_active=True,
        is_temporary_password=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def group(db):
    return create_laptop_group(db, building="Main", floor=1, laptop_count=5)


@pytest.fixture()
def group2(db):
    return create_laptop_group(db, building="Main", floor=2, laptop_count=3)


D = date(2026, 4, 7)
T9 = time(9, 0)
T10 = time(10, 0)
T930 = time(9, 30)
T1030 = time(10, 30)
T11 = time(11, 0)


def test_create_booking_returns_booking(db, teacher, group):
    b = create_booking(db, teacher.id, group.id, D, T9, T10)
    assert b.id is not None
    assert b.teacher_id == teacher.id
    assert b.laptop_group_id == group.id
    assert b.booking_date == D
    assert b.start_time == T9
    assert b.end_time == T10


def test_create_booking_sets_correct_teacher_id(db, teacher, group):
    b = create_booking(db, teacher.id, group.id, D, T9, T10)
    assert b.teacher_id == teacher.id


def test_create_booking_overlap_same_group_raises(db, teacher, group):
    create_booking(db, teacher.id, group.id, D, T9, T10)
    with pytest.raises(ValueError, match="already booked"):
        create_booking(db, teacher.id, group.id, D, T9, T10)


def test_create_booking_partial_overlap_start_raises(db, teacher, group):
    # 09:00–10:00 and 09:30–10:30 overlap
    create_booking(db, teacher.id, group.id, D, T9, T10)
    with pytest.raises(ValueError, match="already booked"):
        create_booking(db, teacher.id, group.id, D, T930, T1030)


def test_create_booking_partial_overlap_end_raises(db, teacher, group):
    # 09:30–10:30 and 09:00–10:00 overlap
    create_booking(db, teacher.id, group.id, D, T930, T1030)
    with pytest.raises(ValueError, match="already booked"):
        create_booking(db, teacher.id, group.id, D, T9, T10)


def test_create_booking_adjacent_slots_allowed(db, teacher, group):
    # 09:00–09:30 and 09:30–10:00 are adjacent, not overlapping
    create_booking(db, teacher.id, group.id, D, T9, T930)
    b = create_booking(db, teacher.id, group.id, D, T930, T10)
    assert b.id is not None


def test_create_booking_different_floor_same_building_same_time_allowed(db, teacher, group, group2):
    # group = Main/floor=1, group2 = Main/floor=2 — different floors, so allowed
    create_booking(db, teacher.id, group.id, D, T9, T10)
    b = create_booking(db, teacher.id, group2.id, D, T9, T10)
    assert b.id is not None



def test_create_booking_same_group_different_date_allowed(db, teacher, group):
    create_booking(db, teacher.id, group.id, D, T9, T10)
    b = create_booking(db, teacher.id, group.id, date(2026, 4, 8), T9, T10)
    assert b.id is not None


def test_create_booking_different_teacher_same_slot_raises(db, teacher, teacher2, group):
    # Two teachers cannot book the same floor at the same time
    create_booking(db, teacher.id, group.id, D, T9, T10)
    with pytest.raises(ValueError, match="already booked"):
        create_booking(db, teacher2.id, group.id, D, T9, T10)


def test_list_bookings_for_week_returns_correct_range(db, teacher, group):
    # Within range
    b1 = create_booking(db, teacher.id, group.id, date(2026, 4, 7), T9, T10)
    b2 = create_booking(db, teacher.id, group.id, date(2026, 4, 13), T9, T10)
    # Outside range
    create_booking(db, teacher.id, group.id, date(2026, 4, 14), T9, T10)

    results = list_bookings_for_week(
        db, date(2026, 4, 7), date(2026, 4, 13), group.id
    )
    ids = [b.id for b in results]
    assert b1.id in ids
    assert b2.id in ids
    assert len(ids) == 2


def test_list_bookings_without_group_returns_all(db, teacher, group, group2):
    b1 = create_booking(db, teacher.id, group.id, D, T9, T10)
    b2 = create_booking(db, teacher.id, group2.id, D, T9, T10)

    results = list_bookings_for_week(db, D, D)
    ids = [b.id for b in results]
    assert b1.id in ids
    assert b2.id in ids
    assert len(ids) == 2


def test_list_bookings_filters_by_group(db, teacher, group, group2):
    b1 = create_booking(db, teacher.id, group.id, D, T9, T10)
    create_booking(db, teacher.id, group2.id, D, T9, T10)

    results = list_bookings_for_week(db, D, D, group.id)
    assert len(results) == 1
    assert results[0].id == b1.id


def test_list_bookings_includes_teacher_and_group(db, teacher, group):
    create_booking(db, teacher.id, group.id, D, T9, T10)
    results = list_bookings_for_week(db, D, D, group.id)
    assert results[0].teacher is not None
    assert results[0].laptop_group is not None


def test_get_booking_returns_none_for_unknown_id(db):
    import uuid
    assert get_booking(db, uuid.uuid4()) is None


def test_update_booking_changes_fields(db, teacher, group):
    b = create_booking(db, teacher.id, group.id, D, T9, T10)
    updated = update_booking(db, b, start_time=T930, end_time=T11)
    assert updated.start_time == T930
    assert updated.end_time == T11


def test_update_booking_does_not_self_conflict(db, teacher, group):
    b = create_booking(db, teacher.id, group.id, D, T9, T10)
    # Updating the same booking to a slightly different time should not conflict with itself
    updated = update_booking(db, b, end_time=T1030)
    assert updated.end_time == T1030


def test_update_booking_raises_on_conflict_with_other(db, teacher, teacher2, group):
    create_booking(db, teacher.id, group.id, D, T930, T11)
    b2 = create_booking(db, teacher2.id, group.id, D, T9, T930)
    with pytest.raises(ValueError, match="already booked"):
        update_booking(db, b2, end_time=T10)


def test_delete_booking_removes_from_db(db, teacher, group):
    b = create_booking(db, teacher.id, group.id, D, T9, T10)
    b_id = b.id
    delete_booking(db, b)
    assert get_booking(db, b_id) is None
