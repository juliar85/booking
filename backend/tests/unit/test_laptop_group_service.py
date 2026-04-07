import pytest

from app.models.laptop_group import LaptopGroup
from app.services.laptop_group_service import (
    create_laptop_group,
    deactivate_laptop_group,
    list_laptop_groups,
    update_laptop_group,
)


def test_create_group_returns_group(db):
    group = create_laptop_group(db, building="Main", floor=1, laptop_count=5)
    assert group.id is not None
    assert group.building == "Main"
    assert group.floor == 1
    assert group.laptop_count == 5
    assert group.is_active is True


def test_create_group_persists_to_db(db):
    create_laptop_group(db, building="Main", floor=2, laptop_count=3)
    result = db.query(LaptopGroup).filter_by(building="Main", floor=2).first()
    assert result is not None
    assert result.laptop_count == 3


def test_create_group_duplicate_building_floor_raises(db):
    create_laptop_group(db, building="Main", floor=1, laptop_count=5)
    with pytest.raises(ValueError, match="already exists"):
        create_laptop_group(db, building="Main", floor=1, laptop_count=3)


def test_create_group_different_floor_allowed(db):
    create_laptop_group(db, building="Main", floor=1, laptop_count=5)
    group2 = create_laptop_group(db, building="Main", floor=2, laptop_count=3)
    assert group2.id is not None


def test_list_groups_returns_active_only(db):
    g1 = create_laptop_group(db, building="A", floor=1, laptop_count=5)
    g2 = create_laptop_group(db, building="A", floor=2, laptop_count=3)
    deactivate_laptop_group(db, g2)

    results = list_laptop_groups(db)
    ids = [g.id for g in results]
    assert g1.id in ids
    assert g2.id not in ids


def test_list_groups_include_inactive(db):
    g1 = create_laptop_group(db, building="A", floor=1, laptop_count=5)
    g2 = create_laptop_group(db, building="A", floor=2, laptop_count=3)
    deactivate_laptop_group(db, g2)

    results = list_laptop_groups(db, include_inactive=True)
    assert len(results) == 2


def test_list_groups_ordered_by_building_floor(db):
    create_laptop_group(db, building="B", floor=1, laptop_count=5)
    create_laptop_group(db, building="A", floor=2, laptop_count=3)
    create_laptop_group(db, building="A", floor=1, laptop_count=4)

    results = list_laptop_groups(db)
    assert results[0].building == "A"
    assert results[0].floor == 1
    assert results[1].building == "A"
    assert results[1].floor == 2
    assert results[2].building == "B"


def test_deactivate_group_sets_inactive(db):
    group = create_laptop_group(db, building="Main", floor=1, laptop_count=5)
    deactivate_laptop_group(db, group)
    db.refresh(group)
    assert group.is_active is False


def test_update_group_changes_laptop_count(db):
    group = create_laptop_group(db, building="Main", floor=1, laptop_count=5)
    updated = update_laptop_group(db, group, laptop_count=10)
    assert updated.laptop_count == 10


def test_update_group_raises_on_duplicate(db):
    create_laptop_group(db, building="Main", floor=1, laptop_count=5)
    g2 = create_laptop_group(db, building="Main", floor=2, laptop_count=3)
    with pytest.raises(ValueError):
        update_laptop_group(db, g2, floor=1)
