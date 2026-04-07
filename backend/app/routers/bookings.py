import uuid
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.booking import BookingCreate, BookingResponse, BookingUpdate
from app.services.booking_service import (
    create_booking,
    delete_booking,
    get_booking,
    list_bookings_for_week,
    update_booking,
)

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("", response_model=list[BookingResponse])
def get_bookings(
    week_start: date = Query(..., description="Start of week (Monday), format YYYY-MM-DD"),
    laptop_group_id: Optional[uuid.UUID] = Query(None, description="Laptop group UUID; omit to get all groups"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    week_end = week_start + timedelta(days=6)
    return list_bookings_for_week(db, week_start, week_end, laptop_group_id)


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_new_booking(
    body: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can create bookings",
        )
    try:
        booking = create_booking(
            db,
            teacher_id=current_user.id,
            laptop_group_id=body.laptop_group_id,
            booking_date=body.booking_date,
            start_time=body.start_time,
            end_time=body.end_time,
            notes=body.notes,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return booking


@router.patch("/{booking_id}", response_model=BookingResponse)
def update_existing_booking(
    booking_id: uuid.UUID,
    body: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = get_booking(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify another teacher's booking",
        )
    try:
        updated = update_booking(
            db,
            booking,
            booking_date=body.booking_date,
            start_time=body.start_time,
            end_time=body.end_time,
            notes=body.notes,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return updated


@router.delete("/{booking_id}", response_model=MessageResponse)
def delete_existing_booking(
    booking_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = get_booking(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete another teacher's booking",
        )
    delete_booking(db, booking)
    return MessageResponse(message="Booking deleted")
