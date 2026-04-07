import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db, require_admin
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.laptop_group import LaptopGroupCreate, LaptopGroupResponse, LaptopGroupUpdate
from app.services.laptop_group_service import (
    create_laptop_group,
    deactivate_laptop_group,
    get_laptop_group,
    list_laptop_groups,
    update_laptop_group,
)

router = APIRouter(prefix="/laptop-groups", tags=["laptop-groups"])


@router.get("", response_model=list[LaptopGroupResponse])
def get_laptop_groups(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return list_laptop_groups(db)


@router.post("", response_model=LaptopGroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    body: LaptopGroupCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        group = create_laptop_group(db, body.building, body.floor, body.laptop_count)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return group


@router.patch("/{group_id}", response_model=LaptopGroupResponse)
def update_group(
    group_id: uuid.UUID,
    body: LaptopGroupUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    group = get_laptop_group(db, group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Laptop group not found")
    try:
        updated = update_laptop_group(
            db, group,
            building=body.building,
            floor=body.floor,
            laptop_count=body.laptop_count,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return updated


@router.delete("/{group_id}", response_model=MessageResponse)
def deactivate_group(
    group_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    group = get_laptop_group(db, group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Laptop group not found")
    deactivate_laptop_group(db, group)
    return MessageResponse(message="Laptop group deactivated")
