import uuid
from datetime import date, time

from sqlalchemy.orm import Session, joinedload

from app.models.booking import Booking
from app.models.laptop_group import LaptopGroup


def _check_overlap(
    db: Session,
    laptop_group_id: uuid.UUID,
    booking_date: date,
    start_time: time,
    end_time: time,
    exclude_id: uuid.UUID | None = None,
) -> bool:
    """Return True if a conflicting booking exists for the same building and floor."""
    target = db.query(LaptopGroup).filter(LaptopGroup.id == laptop_group_id).first()
    if target is None:
        return False

    query = (
        db.query(Booking)
        .join(LaptopGroup, Booking.laptop_group_id == LaptopGroup.id)
        .filter(
            LaptopGroup.building == target.building,
            LaptopGroup.floor == target.floor,
            Booking.booking_date == booking_date,
            Booking.start_time < end_time,
            Booking.end_time > start_time,
        )
    )
    if exclude_id is not None:
        query = query.filter(Booking.id != exclude_id)
    return query.first() is not None


def list_bookings_for_week(
    db: Session,
    week_start: date,
    week_end: date,
    laptop_group_id: uuid.UUID | None = None,
) -> list[Booking]:
    query = (
        db.query(Booking)
        .options(joinedload(Booking.teacher), joinedload(Booking.laptop_group))
        .filter(
            Booking.booking_date >= week_start,
            Booking.booking_date <= week_end,
        )
    )
    if laptop_group_id is not None:
        query = query.filter(Booking.laptop_group_id == laptop_group_id)
    return query.order_by(Booking.booking_date, Booking.start_time).all()


def create_booking(
    db: Session,
    teacher_id: uuid.UUID,
    laptop_group_id: uuid.UUID,
    booking_date: date,
    start_time: time,
    end_time: time,
    notes: str | None = None,
) -> Booking:
    if _check_overlap(db, laptop_group_id, booking_date, start_time, end_time):
        raise ValueError("This floor is already booked during the requested time")

    booking = Booking(
        teacher_id=teacher_id,
        laptop_group_id=laptop_group_id,
        booking_date=booking_date,
        start_time=start_time,
        end_time=end_time,
        notes=notes,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    # Eager-load relationships so they're available without lazy loading
    db.refresh(booking)
    _ = booking.teacher
    _ = booking.laptop_group
    return booking


def get_booking(db: Session, booking_id: uuid.UUID) -> Booking | None:
    return (
        db.query(Booking)
        .options(joinedload(Booking.teacher), joinedload(Booking.laptop_group))
        .filter(Booking.id == booking_id)
        .first()
    )


def update_booking(
    db: Session,
    booking: Booking,
    booking_date: date | None = None,
    start_time: time | None = None,
    end_time: time | None = None,
    notes: str | None = None,
) -> Booking:
    new_date = booking_date if booking_date is not None else booking.booking_date
    new_start = start_time if start_time is not None else booking.start_time
    new_end = end_time if end_time is not None else booking.end_time

    if new_start >= new_end:
        raise ValueError("start_time must be before end_time")

    if _check_overlap(
        db, booking.laptop_group_id, new_date, new_start, new_end, exclude_id=booking.id
    ):
        raise ValueError("This floor is already booked during the requested time")

    booking.booking_date = new_date
    booking.start_time = new_start
    booking.end_time = new_end
    if notes is not None:
        booking.notes = notes

    db.commit()
    db.refresh(booking)
    _ = booking.teacher
    _ = booking.laptop_group
    return booking


def delete_booking(db: Session, booking: Booking) -> None:
    db.delete(booking)
    db.commit()
