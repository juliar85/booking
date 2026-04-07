from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.laptop_group import LaptopGroup


def create_laptop_group(
    db: Session, building: str, floor: int, laptop_count: int
) -> LaptopGroup:
    group = LaptopGroup(building=building, floor=floor, laptop_count=laptop_count)
    db.add(group)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError(f"A laptop group for building '{building}', floor {floor} already exists")
    db.refresh(group)
    return group


def list_laptop_groups(db: Session, include_inactive: bool = False) -> list[LaptopGroup]:
    query = db.query(LaptopGroup)
    if not include_inactive:
        query = query.filter(LaptopGroup.is_active.is_(True))
    return query.order_by(LaptopGroup.building, LaptopGroup.floor).all()


def get_laptop_group(db: Session, group_id) -> LaptopGroup | None:
    return db.query(LaptopGroup).filter(LaptopGroup.id == group_id).first()


def update_laptop_group(db: Session, group: LaptopGroup, **kwargs) -> LaptopGroup:
    for key, value in kwargs.items():
        if value is not None:
            setattr(group, key, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError(
            f"A laptop group for this building/floor combination already exists"
        )
    db.refresh(group)
    return group


def deactivate_laptop_group(db: Session, group: LaptopGroup) -> None:
    group.is_active = False
    db.commit()
