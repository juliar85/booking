import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_admin
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.user import CreateTeacherRequest, TeacherResponse
from app.services.user_service import create_teacher, delete_teacher, list_teachers

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/teachers", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
def add_teacher(
    body: CreateTeacherRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        teacher = create_teacher(db, body.email, body.first_name, body.last_name, body.temporary_password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return teacher


@router.get("/teachers", response_model=list[TeacherResponse])
def get_teachers(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return list_teachers(db)


@router.delete("/teachers/{teacher_id}", response_model=MessageResponse)
def remove_teacher(
    teacher_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        delete_teacher(db, teacher_id)
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return MessageResponse(message="Teacher deleted")
